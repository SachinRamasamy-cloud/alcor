from uuid import uuid4

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.collections.schemas import CollectionDetail, CollectionRead
from app.modules.library import public as library


class CollectionService:
    def __init__(self, database, provider):
        self.database, self.provider = database, provider

    async def owned(self, session, user, collection_id, version=None):
        row = (
            (
                await session.execute(
                    text(
                        "SELECT * FROM personal.collections WHERE user_id=:user AND id=:id AND deleted_at IS NULL FOR UPDATE"
                    ),
                    {"user": user, "id": collection_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            raise AppError(404, "NOT_FOUND", "This collection is not available.")
        if version is not None and row["version"] != version:
            raise AppError(409, "CONFLICT", "Review the latest collection.")
        return row

    async def read_in_transaction(self, session, user, collection_id, offset=0):
        row = await self.owned(session, user, collection_id)
        total = await session.scalar(
            text(
                "SELECT count(*) FROM personal.collection_items WHERE user_id=:user AND collection_id=:id"
            ),
            {"user": user, "id": collection_id},
        )
        items = (
            (
                await session.execute(
                    text(
                        "SELECT m.payload,i.position FROM personal.collection_items i JOIN catalogue.media m ON m.id=i.media_id WHERE i.user_id=:user AND i.collection_id=:id ORDER BY i.position,i.media_id OFFSET :offset LIMIT 100"
                    ),
                    {"user": user, "id": collection_id, "offset": offset},
                )
            )
            .mappings()
            .all()
        )
        return CollectionDetail(
            id=row["id"],
            name=row["name"],
            version=row["version"],
            total=total,
            items=[{"media": r["payload"], "position": r["position"]} for r in items],
            next_offset=offset + 100 if total > offset + 100 else None,
        )

    async def read(self, user, collection_id, offset=0):
        async with self.database.transaction(user) as session:
            return await self.read_in_transaction(session, user, collection_id, offset)

    async def list(self, user, after=None, page=None):
        if page is not None and after:
            raise AppError(422, "INVALID_REQUEST", "Choose a page or cursor, not both.")
        async with self.database.transaction(user) as session:
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT c.id,c.name,c.version,count(i.media_id) AS total FROM personal.collections c LEFT JOIN personal.collection_items i ON(i.user_id,i.collection_id)=(c.user_id,c.id) WHERE c.user_id=:user AND c.deleted_at IS NULL AND(CAST(:after AS uuid) IS NULL OR c.id>:after) GROUP BY c.id,c.name,c.version ORDER BY c.id LIMIT 101 OFFSET :offset"
                        ),
                        {"user": user, "after": after, "offset": ((page or 1) - 1) * 100},
                    )
                )
                .mappings()
                .all()
            )
            total = await session.scalar(
                text(
                    "SELECT count(*) FROM personal.collections WHERE user_id=:user AND deleted_at IS NULL"
                ),
                {"user": user},
            )
            return {
                "total": total,
                "page": page or 1,
                "total_pages": max(1, (total + 99) // 100),
                "data": [CollectionRead.model_validate(r) for r in rows[:100]],
                "next_cursor": str(rows[99]["id"]) if len(rows) > 100 else None,
            }

    async def create(self, user, body):
        async with self.database.transaction(user) as session:
            collection_id = uuid4()
            await session.execute(
                text(
                    "INSERT INTO personal.collections(id,user_id,name,request_id) VALUES(:id,:user,:name,:request) ON CONFLICT(user_id,request_id) DO NOTHING"
                ),
                {"id": collection_id, "user": user, "name": body.name, "request": body.request_id},
            )
            stored = await session.scalar(
                text(
                    "SELECT id FROM personal.collections WHERE user_id=:user AND request_id=:request"
                ),
                {"user": user, "request": body.request_id},
            )
            result = await self.read_in_transaction(session, user, stored)
            if stored == collection_id:
                await library.record_activity(
                    session,
                    user,
                    None,
                    "collection.created",
                    None,
                    {"collection_id": str(stored), "name": body.name},
                )
        return result

    async def update(self, user, collection_id, version, name=None, delete=False):
        if name is not None and not name.strip():
            raise AppError(422, "INVALID_REQUEST", "Enter a collection name.")
        async with self.database.transaction(user) as session:
            row = await self.owned(session, user, collection_id, version)
            await session.execute(
                text(
                    "UPDATE personal.collections SET name=COALESCE(:name,name),deleted_at=CASE WHEN :deleted THEN now() ELSE deleted_at END,version=version+1,updated_at=now() WHERE user_id=:user AND id=:id"
                ),
                {
                    "name": name.strip() if name is not None else None,
                    "deleted": delete,
                    "user": user,
                    "id": collection_id,
                },
            )
            await library.record_activity(
                session,
                user,
                None,
                "collection.deleted" if delete else "collection.renamed",
                {"name": row["name"]},
                {"collection_id": str(collection_id)},
            )
            result = (
                {"deleted": True}
                if delete
                else await self.read_in_transaction(session, user, collection_id)
            )
        return result

    async def item(self, user, collection_id, media_id, body, remove=False):
        media = (
            None
            if remove
            else await library.prepare_media(self.database, self.provider, user, media_id)
        )
        async with self.database.transaction(user) as session:
            await self.owned(session, user, collection_id, body.expected_version)
            if remove:
                changed = (
                    await session.execute(
                        text(
                            "DELETE FROM personal.collection_items WHERE user_id=:user AND collection_id=:id AND media_id=:media"
                        ),
                        {"user": user, "id": collection_id, "media": media_id},
                    )
                ).rowcount > 0
            else:
                await library.ensure_media(session, media)
                result = await session.execute(
                    text(
                        "INSERT INTO personal.collection_items(user_id,collection_id,media_id,position) VALUES(:user,:id,:media,:position) ON CONFLICT(user_id,collection_id,media_id) DO UPDATE SET position=excluded.position WHERE personal.collection_items.position IS DISTINCT FROM excluded.position"
                    ),
                    {
                        "user": user,
                        "id": collection_id,
                        "media": media_id,
                        "position": body.position,
                    },
                )
                changed = result.rowcount > 0
            if changed:
                await session.execute(
                    text(
                        "UPDATE personal.collections SET version=version+1,updated_at=now() WHERE user_id=:user AND id=:id"
                    ),
                    {"user": user, "id": collection_id},
                )
                await library.record_activity(
                    session,
                    user,
                    media_id,
                    "collection.item_removed" if remove else "collection.item_saved",
                    None,
                    {"collection_id": str(collection_id), "position": body.position},
                )
            value = await self.read_in_transaction(session, user, collection_id)
        return value
