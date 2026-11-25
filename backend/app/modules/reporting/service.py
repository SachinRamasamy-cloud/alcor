import base64
import json
from datetime import datetime
from uuid import UUID

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.library import public as library
from app.modules.reporting.schemas import HistoryPage
from app.modules.tracking import public as tracking


def undo_version(row):
    before = row["before_state"] or {}
    after = row["after_state"] or {}
    if row["action"] == "library.details":
        return after.get("version")
    if row["action"] in {"wishlist.removed", "library.removed"}:
        return before.get("version", 0) + 1 if before.get("version") else None
    if row["action"] == "tracking.progress" and not after.get("completed"):
        return before.get("version", 0) + 1 if before.get("version") else None
    return None


class ReportingService:
    def __init__(self, database):
        self.database = database

    async def history(self, user, limit=24, cursor=None, media_id=None):
        stamp, last = None, None
        if cursor:
            try:
                payload = json.loads(base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4)))
                stamp, last = datetime.fromisoformat(payload["time"]), UUID(payload["id"])
                if stamp.tzinfo is None:
                    raise ValueError("Timezone required")
            except (ValueError, TypeError, KeyError) as exc:
                raise AppError(422, "INVALID_CURSOR", "Reset the filters and try again.") from exc
        async with self.database.transaction(user) as session:
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT a.*,m.payload->>'title' AS title,(u.activity_id IS NOT NULL) AS undone FROM personal.activity a LEFT JOIN catalogue.media m ON m.id=a.media_id LEFT JOIN personal.undo_actions u ON(u.user_id,u.activity_id)=(a.user_id,a.id) WHERE a.user_id=:user AND(CAST(:media AS uuid) IS NULL OR a.media_id=:media) AND(CAST(:stamp AS timestamptz) IS NULL OR(a.occurred_at,a.id)<(CAST(:stamp AS timestamptz),CAST(:last AS uuid))) ORDER BY a.occurred_at DESC,a.id DESC LIMIT :limit"
                        ),
                        {
                            "user": user,
                            "media": media_id,
                            "stamp": stamp,
                            "last": last,
                            "limit": limit + 1,
                        },
                    )
                )
                .mappings()
                .all()
            )
            data = [
                {
                    "id": r["id"],
                    "media_id": r["media_id"],
                    "title": r["title"],
                    "action": r["action"],
                    "occurred_at": r["occurred_at"],
                    "can_undo": undo_version(r) is not None and not r["undone"],
                    "undone": r["undone"],
                    "expected_version": undo_version(r),
                }
                for r in rows[:limit]
            ]
            next_cursor = (
                base64.urlsafe_b64encode(
                    json.dumps(
                        {
                            "time": rows[limit - 1]["occurred_at"].isoformat(),
                            "id": str(rows[limit - 1]["id"]),
                        }
                    ).encode()
                )
                .decode()
                .rstrip("=")
                if len(rows) > limit
                else None
            )
            return HistoryPage(data=data, next_cursor=next_cursor)

    async def undo(self, user, activity_id, version):
        async with self.database.transaction(user) as session:
            await session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": str(user) + ":" + str(activity_id)},
            )
            row = (
                (
                    await session.execute(
                        text("SELECT * FROM personal.activity WHERE user_id=:user AND id=:id"),
                        {"user": user, "id": activity_id},
                    )
                )
                .mappings()
                .one_or_none()
            )
            if row is None:
                raise AppError(404, "NOT_FOUND", "This action is not available.")
            if await session.scalar(
                text("SELECT 1 FROM personal.undo_actions WHERE user_id=:user AND activity_id=:id"),
                {"user": user, "id": activity_id},
            ):
                return {"undone": True, "changed": False}
            if undo_version(row) != version:
                raise AppError(409, "CONFLICT", "This change cannot be undone safely.")
            if row["action"] == "tracking.progress":
                await tracking.undo_progress(session, user, row, version)
            else:
                await library.undo_change(session, user, row, version)
            await session.execute(
                text("INSERT INTO personal.undo_actions(user_id,activity_id) VALUES(:user,:id)"),
                {"user": user, "id": activity_id},
            )
            await library.record_activity(
                session,
                user,
                row["media_id"],
                "undo.applied",
                None,
                {"activity_id": str(activity_id)},
            )
        return {"undone": True, "changed": True}

    async def statistics(self, user):
        async with self.database.transaction(user) as session:
            library_counts = (
                (
                    await session.execute(
                        text(
                            "SELECT count(*) AS titles,count(*) FILTER(WHERE ever_completed) AS ever_completed,count(*) FILTER(WHERE status='in_progress') AS in_progress,count(*) FILTER(WHERE status='planned') AS planned,count(*) FILTER(WHERE favorite) AS favorites,avg(rating) AS average_rating FROM personal.library_entries WHERE user_id=:user AND deleted_at IS NULL"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one()
            )
            progress = (
                (
                    await session.execute(
                        text(
                            "SELECT count(*) FILTER(WHERE p.state='watched') AS watching_events,count(*) FILTER(WHERE p.state='read') AS reading_events,count(DISTINCT(p.media_id,p.unit_key)) FILTER(WHERE p.state='watched') AS unique_episodes,count(DISTINCT(p.media_id,p.unit_key)) FILTER(WHERE p.state='read') AS unique_chapters,count(*) FILTER(WHERE p.state='skipped') AS skipped FROM personal.unit_progress p WHERE p.user_id=:user"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one()
            )
            repeats = await session.scalar(
                text(
                    "SELECT count(*) FROM personal.tracking_sessions WHERE user_id=:user AND kind='repeat'"
                ),
                {"user": user},
            )
            genres = (
                (
                    await session.execute(
                        text(
                            "SELECT g.value AS name,count(*) AS count FROM personal.library_entries e JOIN catalogue.media m ON m.id=e.media_id CROSS JOIN LATERAL jsonb_array_elements_text(m.payload->'genres') AS g(value) WHERE e.user_id=:user AND e.deleted_at IS NULL GROUP BY g.value ORDER BY count(*) DESC,g.value LIMIT 50"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .all()
            )
            return {
                "library": dict(library_counts),
                "progress": dict(progress),
                "repeat_sessions": repeats,
                "genres": [dict(g) for g in genres],
                "estimated_watch_minutes": None,
                "time_coverage": "Duration metadata is not available for this calculation.",
            }
