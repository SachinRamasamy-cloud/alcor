"""Saved-record queries: fixed SQL ordering and literal, account-owned search."""

import base64
from uuid import UUID

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.library import repository as repo
from app.modules.library.schemas import LibraryPage, LibraryQueryContext

FILTERS = """e.user_id=:user AND e.deleted_at IS NULL
    AND (CAST(:status AS text) IS NULL OR e.status=:status)
    AND (CAST(:type AS text) IS NULL OR m.media_type=:type)
    AND (:q='' OR strpos(lower(m.payload->>'title'),lower(:q))>0
      OR strpos(lower(COALESCE(m.payload->>'original_title','')),lower(:q))>0
      OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(m.payload->'aliases')='array' THEN m.payload->'aliases' ELSE '[]'::jsonb END
      ) AS alias(value) WHERE strpos(lower(alias.value),lower(:q))>0))"""

METRICS = """(SELECT max(a.occurred_at) FROM personal.activity a
    WHERE a.user_id=e.user_id AND a.media_id=e.media_id AND (
      (a.action IN ('library.added','library.updated') AND a.after_state->>'status'='completed'
       AND a.before_state->>'status' IS DISTINCT FROM 'completed')
      OR (a.action IN ('tracking.completed_assertion','tracking.progress') AND a.after_state->>'completed'='true')
    )) AS completion_recorded_at,
    (SELECT (SELECT count(*) FROM personal.unit_progress p
      JOIN personal.tracking_units u ON (u.user_id,u.session_id,u.key)=(p.user_id,p.session_id,p.unit_key)
      WHERE p.user_id=e.user_id AND p.session_id=s.id AND u.released
      AND p.state=CASE WHEN m.media_type='anime' THEN 'watched' ELSE 'read' END)
     FROM personal.tracking_sessions s WHERE s.user_id=e.user_id AND s.media_id=e.media_id
     ORDER BY s.active DESC,s.created_at DESC,s.id DESC LIMIT 1) AS recorded_units"""

ORDERS = {
    "id": "e.media_id",
    "title": "lower(m.payload->>'title') ASC NULLS LAST,e.media_id",
    "saved": "e.created_at DESC NULLS LAST,e.media_id",
    "completion_recorded": "completion_recorded_at DESC NULLS LAST,e.media_id",
    "rating": "e.rating DESC NULLS LAST,e.media_id",
    "recorded_units": "recorded_units DESC NULLS LAST,e.media_id",
}


async def read_page(
    database, user, status, limit, cursor, page=None, q="", media_type=None, sort="id"
):
    q = q.strip()
    if len(q) > 200 or sort not in ORDERS or media_type not in {None, "anime", "manga"}:
        raise AppError(422, "INVALID_REQUEST", "Review the library filters.")
    filtered = bool(q or media_type or sort != "id")
    if cursor and (page is not None or filtered):
        raise AppError(422, "INVALID_REQUEST", "Choose a numbered page for these filters.")
    last = None
    if cursor:
        try:
            last = UUID(base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4)).decode())
        except (ValueError, UnicodeError) as exc:
            raise AppError(422, "INVALID_CURSOR", "Reset the filters and try again.") from exc
    params = {
        "user": user,
        "status": status,
        "q": q,
        "type": media_type,
        "cursor": last,
        "limit": limit + 1,
        "offset": ((page or 1) - 1) * limit,
    }
    async with database.transaction(user) as session:
        rows = (
            (
                await session.execute(
                    text(f"""
            SELECT e.*, {repo.ACTIVE_SESSION}, {repo.EFFECTIVE_FAVORITE}, m.payload, {METRICS}
            FROM personal.library_entries e JOIN catalogue.media m ON m.id=e.media_id {repo.PREFERENCE_JOIN}
            WHERE {FILTERS} AND (CAST(:cursor AS uuid) IS NULL OR e.media_id>CAST(:cursor AS uuid))
            ORDER BY {ORDERS[sort]} LIMIT :limit OFFSET :offset
        """),
                    params,
                )
            )
            .mappings()
            .all()
        )
        total = await session.scalar(
            text(f"""SELECT count(*) FROM personal.library_entries e
            JOIN catalogue.media m ON m.id=e.media_id WHERE {FILTERS}"""),
            params,
        )
        entries = [repo.to_entry(row) for row in rows[:limit]]
        next_cursor = (
            base64.urlsafe_b64encode(str(entries[-1].media.id).encode()).decode().rstrip("=")
            if len(rows) > limit and not filtered
            else None
        )
        return LibraryPage(
            data=entries,
            total=total,
            next_cursor=next_cursor,
            page=page or 1,
            total_pages=max(1, (total + limit - 1) // limit),
            query_context=LibraryQueryContext(q=q, media_type=media_type, status=status, sort=sort),
        )
