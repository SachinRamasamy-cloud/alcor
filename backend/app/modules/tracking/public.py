"""Narrow atomic start integration for library status workflows."""

from uuid import uuid4

from sqlalchemy import text


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
