"""Narrow transaction integration used by tracking workflows."""

from uuid import UUID

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.library import repository as repo


async def prepare_media(database, provider, user: UUID, media_id: UUID):
    async with database.transaction(user) as session:
        media = await repo.stored_media(session, media_id)
    if media is None:
        media = next((m for m in await provider.catalogue() if m.id == media_id), None)
    if media is None:
        raise AppError(404, "NOT_FOUND", "This title is not available.")
    return media


async def lock_for_tracking(session, user, media, repeat: bool):
    await repo.ensure_media(session, media)
    await repo.create_entry(session, user, media.id, "in_progress")
    entry = await repo.lock_entry(session, user, media.id)
    if entry["deleted_at"] is not None or entry["status"] == "not_interested":
        raise AppError(409, "CONFLICT", "Review the latest library state first.")
    if entry["ever_completed"] and not repeat:
        raise AppError(409, "CONFLICT", "Start a repeat session for a completed title.")
    return entry


async def set_tracking_status(session, user, media_id, completed: bool):
    await session.execute(
        text(
            "UPDATE personal.library_entries SET status=:status,ever_completed=ever_completed OR :completed,priority='normal',reason=NULL,version=version+1,updated_at=now() WHERE user_id=:user AND media_id=:media"
        ),
        {
            "status": "completed" if completed else "in_progress",
            "completed": completed,
            "user": user,
            "media": media_id,
        },
    )


record_activity = repo.record_activity
ensure_media = repo.ensure_media
