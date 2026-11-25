import base64
from uuid import UUID

from sqlalchemy import text

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import MetadataProvider
from app.modules.library import repository as repo
from app.modules.library.schemas import LibraryMutation, LibraryPage, LibraryWrite, WishlistWrite
from app.modules.tracking.public import ensure_initial_session

TRANSITIONS = {
    "planned": {"in_progress", "completed", "dropped", "not_interested"},
    "in_progress": {"on_hold", "dropped", "completed"},
    "on_hold": {"in_progress"},
    "dropped": {"in_progress"},
    "completed": set(),
    "not_interested": set(),
}


class LibraryService:
    def __init__(self, database: Database, provider: MetadataProvider):
        self.database, self.provider = database, provider

    async def list_entries(self, user_id: UUID, status: str | None, limit: int, cursor: str | None):
        last = None
        if cursor:
            try:
                last = UUID(base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4)).decode())
            except (ValueError, UnicodeDecodeError) as exc:
                raise AppError(422, "INVALID_CURSOR", "Reset the filters and try again.") from exc
        async with self.database.transaction(user_id) as session:
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT e.*,m.payload FROM personal.library_entries e JOIN catalogue.media m ON m.id=e.media_id WHERE e.user_id=:user AND e.deleted_at IS NULL AND (CAST(:status AS text) IS NULL OR e.status=:status) AND (CAST(:cursor AS uuid) IS NULL OR e.media_id>CAST(:cursor AS uuid)) ORDER BY e.media_id LIMIT :limit"
                        ),
                        {"user": user_id, "status": status, "cursor": last, "limit": limit + 1},
                    )
                )
                .mappings()
                .all()
            )
            total = await session.scalar(
                text(
                    "SELECT count(*) FROM personal.library_entries WHERE user_id=:user AND deleted_at IS NULL AND (CAST(:status AS text) IS NULL OR status=:status)"
                ),
                {"user": user_id, "status": status},
            )
            entries = [repo.to_entry(row) for row in rows[:limit]]
            next_cursor = (
                base64.urlsafe_b64encode(str(entries[-1].media.id).encode()).decode().rstrip("=")
                if len(rows) > limit
                else None
            )
            return LibraryPage(data=entries, total=total, next_cursor=next_cursor)

    async def change(
        self,
        user_id: UUID,
        media_id: UUID,
        change: LibraryWrite,
        wishlist: WishlistWrite | None = None,
    ) -> LibraryMutation:
        # Read/fetch metadata before the short write transaction. Existing personal
        # entries remain available even when the provider is disabled.
        async with self.database.transaction(user_id) as session:
            media = await repo.stored_media(session, media_id)
        if media is None:
            media = next(
                (item for item in await self.provider.catalogue() if item.id == media_id), None
            )
        if media is None:
            raise AppError(404, "NOT_FOUND", "This title is not available.")
        async with self.database.transaction(user_id) as session:
            await repo.ensure_media(session, media)
            existing = await repo.lock_entry(session, user_id, media_id)
            created = existing is None
            if created:
                if change.status not in {"planned", "in_progress", "completed", "not_interested"}:
                    raise AppError(422, "INVALID_TRANSITION", "Choose a valid initial status.")
                created = await repo.create_entry(session, user_id, media_id, change.status)
                existing = await repo.lock_entry(session, user_id, media_id)
                # A competing creation may have won; its desired state still goes
                # through the same locked/version-checked rules below.
            before = dict(existing)
            same_status = existing["status"] == change.status and existing["deleted_at"] is None
            same_wishlist = not wishlist or (
                existing["priority"] == wishlist.priority and existing["reason"] == wishlist.reason
            )
            if same_status and same_wishlist and not created:
                return LibraryMutation(
                    entry=await repo.read_entry(session, user_id, media_id), changed=False
                )
            if not created and existing["deleted_at"] is None:
                if change.expected_version != existing["version"]:
                    raise AppError(409, "CONFLICT", "Review the latest state and try again.")
                if not same_status and change.status not in TRANSITIONS[existing["status"]]:
                    raise AppError(
                        422,
                        "INVALID_TRANSITION",
                        "This status change requires a deliberate correction or new session.",
                    )
            await session.execute(
                text(
                    "UPDATE personal.library_entries SET status=:status,ever_completed=ever_completed OR :completed,priority=:priority,reason=:reason,deleted_at=NULL,version=version+:increment,updated_at=now() WHERE user_id=:user AND media_id=:media"
                ),
                {
                    "status": change.status,
                    "completed": change.status == "completed",
                    "priority": wishlist.priority if wishlist else "normal",
                    "reason": wishlist.reason if wishlist else None,
                    "increment": 0 if created else 1,
                    "user": user_id,
                    "media": media_id,
                },
            )
            if change.status == "in_progress":
                await ensure_initial_session(session, user_id, media_id)
            entry = await repo.read_entry(session, user_id, media_id)
            await repo.record_activity(
                session,
                user_id,
                media_id,
                "library.added" if created else "library.updated",
                None if created else before,
                entry.model_dump(mode="json", exclude={"media"}),
            )
        return LibraryMutation(entry=entry, changed=True)  # Commit completed before success.

    async def remove_wishlist(self, user_id: UUID, media_id: UUID, version: int):
        async with self.database.transaction(user_id) as session:
            current = await repo.lock_entry(session, user_id, media_id)
            if current is None:
                raise AppError(404, "NOT_FOUND", "This item is not available.")
            if current["deleted_at"] is not None:
                return LibraryMutation(
                    entry=await repo.read_entry(session, user_id, media_id), changed=False
                )
            if current["version"] != version or current["status"] != "planned":
                raise AppError(409, "CONFLICT", "Review the latest state and try again.")
            await session.execute(
                text(
                    "UPDATE personal.library_entries SET deleted_at=now(),updated_at=now(),version=version+1 WHERE user_id=:user AND media_id=:media"
                ),
                {"user": user_id, "media": media_id},
            )
            entry = await repo.read_entry(session, user_id, media_id)
            await repo.record_activity(
                session, user_id, media_id, "wishlist.removed", dict(current), {"deleted": True}
            )
        return LibraryMutation(entry=entry, changed=True)
