"""Narrow atomic start integration for library status workflows."""

from uuid import uuid4

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.tracking import repository as repo


async def ensure_initial_session(session, user, media_id):
    active = await session.scalar(
        text(
            "SELECT id FROM personal.tracking_sessions WHERE user_id=:user AND media_id=:media AND active"
        ),
        {"user": user, "media": media_id},
    )
    if active is None:
        await session.execute(
            text(
                "INSERT INTO personal.tracking_sessions(id,user_id,media_id,request_id,kind) VALUES (:id,:user,:media,:request,'initial')"
            ),
            {"id": uuid4(), "user": user, "media": media_id, "request": uuid4()},
        )


async def undo_progress(session, user, activity, version):
    from uuid import UUID

    session_id = UUID(activity["after_state"]["session_id"])
    row = await repo.session_row(session, user, session_id)
    if row is None:
        raise AppError(404, "NOT_FOUND", "This session is not available.")
    await session.execute(
        text(
            "SELECT media_id FROM personal.library_entries WHERE user_id=:user AND media_id=:media FOR UPDATE"
        ),
        {"user": user, "media": row["media_id"]},
    )
    row = await repo.session_row(session, user, session_id, lock=True)
    if row["version"] != version or not row["active"] or activity["after_state"].get("completed"):
        raise AppError(409, "CONFLICT", "This session changed after the original action.")
    for change in activity["after_state"].get("changes", []):
        await repo.set_mark(
            session, user, session_id, row["media_id"], change["key"], change["before"]
        )
    await session.execute(
        text(
            "UPDATE personal.tracking_sessions SET version=version+1,updated_at=now() WHERE user_id=:user AND id=:id"
        ),
        {"user": user, "id": session_id},
    )
