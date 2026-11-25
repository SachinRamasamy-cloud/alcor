"""Owned feedback never creates consumption records or canonical media."""

import base64
import json
from uuid import UUID

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.discovery.schemas import (
    CandidateFeedback,
    FeedbackItem,
    FeedbackMutation,
    FeedbackPage,
)
from app.modules.library import public as library

MATCH_CANDIDATES = """
    FROM jsonb_to_recordset(CAST(:candidates AS jsonb)) AS i(anilist_id text,mal_id text,media_type text)
    JOIN catalogue.media m ON m.media_type=i.media_type AND (
      m.external_id='anilist:'||i.anilist_id OR m.external_id=i.mal_id OR m.id IN (
        SELECT s.media_id FROM catalogue.source_ids s WHERE s.media_type=i.media_type AND
        ((s.namespace='anilist' AND s.external_id=i.anilist_id) OR (s.namespace='mal' AND s.external_id=i.mal_id))))
"""


def candidate_payload(candidates):
    return json.dumps(
        [
            dict(
                anilist_id=str(c.anilist_id),
                mal_id=str(c.mal_id) if c.mal_id else None,
                media_type=c.media_type,
            )
            for c in candidates
        ]
    )


async def write(database, user, media_id, body):
    async with database.transaction(user) as session:
        await session.execute(
            text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
            {"key": f"recommendation-feedback:{user}:{media_id}"},
        )
        if await library.verified_ids(session, [media_id]) != {media_id}:
            raise AppError(404, "NOT_FOUND", "This title is not available.")
        row = (
            (
                await session.execute(
                    text(
                        "SELECT * FROM personal.recommendation_feedback WHERE user_id=:user AND media_id=:media FOR UPDATE"
                    ),
                    {"user": user, "media": media_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        current = dict(row) if row else {"media_id": media_id, "dismissed": False, "version": 0}
        if current["dismissed"] == body.dismissed:
            return FeedbackMutation(**current, changed=False)
        if current["version"] != body.expected_version:
            raise AppError(409, "CONFLICT", "Review the latest recommendation feedback.")
        updated = (
            (
                await session.execute(
                    text("""
            INSERT INTO personal.recommendation_feedback(user_id,media_id,dismissed,version,updated_at,context)
            VALUES(:user,:media,:dismissed,1,now(),:context)
            ON CONFLICT(user_id,media_id) DO UPDATE SET dismissed=excluded.dismissed,
              version=personal.recommendation_feedback.version+1,updated_at=now(),context=excluded.context
            RETURNING media_id,dismissed,version,updated_at,context
        """),
                    {
                        "user": user,
                        "media": media_id,
                        "dismissed": body.dismissed,
                        "context": body.context,
                    },
                )
            )
            .mappings()
            .one()
        )
        await library.record_activity(
            session,
            user,
            media_id,
            "recommendation.dismissed" if body.dismissed else "recommendation.restored",
            {key: current.get(key) for key in ("dismissed", "version", "updated_at", "context")},
            dict(updated),
        )
        result = FeedbackMutation(**updated, changed=True)
    return result


async def read(database, user, candidates):
    async with database.transaction(user) as session:
        rows = (
            (
                await session.execute(
                    text(f"""
            SELECT i.anilist_id,m.id AS media_id,f.dismissed,f.version,f.updated_at,f.context
            {MATCH_CANDIDATES}
            LEFT JOIN personal.recommendation_feedback f ON f.user_id=:user AND f.media_id=m.id
        """),
                    {"user": user, "candidates": candidate_payload(candidates)},
                )
            )
            .mappings()
            .all()
        )
        by_id = {}
        for row in rows:
            key = int(row["anilist_id"])
            if key in by_id and by_id[key]["media_id"] != row["media_id"]:
                raise AppError(409, "IDENTITY_CONFLICT", "This title's identity needs review.")
            by_id[key] = row
        result = []
        for key in dict.fromkeys(c.anilist_id for c in candidates):
            row = by_id.get(key)
            result.append(
                CandidateFeedback(
                    anilist_id=key,
                    media_id=row["media_id"] if row else None,
                    dismissed=bool(row and row["dismissed"]),
                    version=row["version"] or 0 if row else 0,
                    updated_at=row["updated_at"] if row else None,
                    context=row["context"] if row else None,
                )
            )
        return result


async def page(database, user, limit, cursor):
    last = None
    if cursor:
        try:
            last = UUID(base64.urlsafe_b64decode(cursor.encode()).decode())
        except (ValueError, UnicodeError) as exc:
            raise AppError(422, "INVALID_CURSOR", "Choose a valid feedback page.") from exc
    async with database.transaction(user) as session:
        total = await session.scalar(
            text(
                "SELECT count(*) FROM personal.recommendation_feedback WHERE user_id=:user AND dismissed"
            ),
            {"user": user},
        )
        rows = (
            (
                await session.execute(
                    text("""
            SELECT * FROM personal.recommendation_feedback WHERE user_id=:user AND dismissed
            AND (CAST(:last AS uuid) IS NULL OR media_id>CAST(:last AS uuid)) ORDER BY media_id LIMIT :limit
        """),
                    {"user": user, "last": last, "limit": limit + 1},
                )
            )
            .mappings()
            .all()
        )
        media = {
            item.id: item
            for item in await library.stored_media_batch(
                session, [row["media_id"] for row in rows[:limit]]
            )
        }
        items = [FeedbackItem(**row, media=media[row["media_id"]]) for row in rows[:limit]]
        next_cursor = (
            base64.urlsafe_b64encode(str(items[-1].media_id).encode()).decode()
            if len(rows) > limit
            else None
        )
        return FeedbackPage(data=items, total=total, next_cursor=next_cursor)
