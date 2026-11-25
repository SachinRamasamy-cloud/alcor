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
stored_media = repo.stored_media
owned_entry = repo.owned_entry
verified_ids = repo.verified_ids
stored_media_batch = repo.stored_media_batch
favorite_ids = repo.favorite_ids
sync_favorite_flags = repo.sync_favorite_flags


async def undo_change(session, user, activity, version):
    from app.modules.preferences import public as preferences

    before, after = activity["before_state"] or {}, activity["after_state"] or {}
    favorite_change = activity["action"] == "library.details" and (
        "favorite" in after and before.get("favorite") != after["favorite"]
    )
    if favorite_change:
        await preferences.lock_state(session, user)
        current = await preferences.read_state(session, user)
        expected = after.get("favorite_preference_version")
        if expected is not None and current.version != expected:
            raise AppError(409, "CONFLICT", "Preferences changed after this favourite edit.")
    row = await repo.lock_entry(session, user, activity["media_id"])
    if row is None or row["version"] != version:
        raise AppError(409, "CONFLICT", "This item changed after the original action.")
    if activity["action"] == "library.details":
        if row["deleted_at"] is not None:
            raise AppError(409, "CONFLICT", "This item is no longer active.")
        values = {
            k: before.get(k) for k in ("rating", "notes", "favorite", "tags", "priority", "reason")
        }
        values["tags"] = values["tags"] or []
        if favorite_change and (after.get("favorite_preference_version") is not None
                                or before.get("favorite")
                                or activity["media_id"] not in preferences.setup_ids(current.data)):
            await preferences.set_choice(session, user, activity["media_id"], bool(before.get("favorite")),
                                         skip_library={activity["media_id"]}, record=False,
                                         restore_setup=bool(before.get("setup_favorite")))
        columns = ",".join(f"{k}=:{k}" for k in values)
        await session.execute(
            text(
                f"UPDATE personal.library_entries SET {columns},version=version+1,updated_at=now() WHERE user_id=:user AND media_id=:media"
            ),
            {**values, "user": user, "media": activity["media_id"]},
        )
    elif activity["action"] in {"wishlist.removed", "library.removed"}:
        if row["deleted_at"] is None:
            raise AppError(409, "CONFLICT", "This item has already changed.")
        await session.execute(
            text(
                "UPDATE personal.library_entries SET deleted_at=NULL,version=version+1,updated_at=now() WHERE user_id=:user AND media_id=:media"
            ),
            {"user": user, "media": activity["media_id"]},
        )
    else:
        raise AppError(409, "CONFLICT", "This change cannot be undone safely.")
