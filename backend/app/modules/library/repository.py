import json
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.metadata.schemas import Media
from app.modules.library.schemas import LibraryEntry

ACTIVE_SESSION = """(SELECT jsonb_build_object('id',s.id,'kind',s.kind,'version',s.version)
    FROM personal.tracking_sessions s WHERE s.user_id=e.user_id
    AND s.media_id=e.media_id AND s.active) AS active_session"""


def to_entry(row) -> LibraryEntry:
    values = dict(row)
    values["media"] = values.pop("payload")
    return LibraryEntry.model_validate(values)


async def stored_media(session: AsyncSession, media_id: UUID) -> Media | None:
    payload = await session.scalar(
        text("SELECT payload FROM catalogue.media WHERE id=:id"), {"id": media_id}
    )
    return Media.model_validate(payload) if payload else None


async def ensure_media(session: AsyncSession, media: Media):
    identities = media.source_ids or (
        {"mal": media.external_id} if media.external_id.isdecimal() else {}
    )
    for namespace, external in sorted(identities.items()):
        await session.execute(
            text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
            {"key": f"{namespace}:{media.media_type}:{external}"},
        )
    await session.execute(
        text(
            "INSERT INTO catalogue.media(id,media_type,external_id,payload) VALUES (:id,:type,:external,CAST(:payload AS jsonb)) ON CONFLICT DO NOTHING"
        ),
        {
            "id": media.id,
            "type": media.media_type,
            "external": media.external_id,
            "payload": media.model_dump_json(),
        },
    )
    canonical_id = await session.scalar(
        text("SELECT id FROM catalogue.media WHERE media_type=:type AND external_id=:external"),
        {"type": media.media_type, "external": media.external_id},
    )
    if canonical_id != media.id:
        from app.core.errors import AppError

        raise AppError(409, "IDENTITY_CONFLICT", "This title's identity needs review.")
    for namespace, external in identities.items():
        await session.execute(
            text(
                "INSERT INTO catalogue.source_ids(namespace,media_type,external_id,media_id) VALUES(:namespace,:kind,:external,:media) ON CONFLICT DO NOTHING"
            ),
            {
                "namespace": namespace,
                "kind": media.media_type,
                "external": external,
                "media": media.id,
            },
        )
        associated = await session.scalar(
            text(
                "SELECT media_id FROM catalogue.source_ids WHERE namespace=:namespace AND media_type=:kind AND external_id=:external"
            ),
            {"namespace": namespace, "kind": media.media_type, "external": external},
        )
        if associated != media.id:
            from app.core.errors import AppError

            raise AppError(409, "IDENTITY_CONFLICT", "This title's identity needs review.")


async def lock_entry(session: AsyncSession, user_id: UUID, media_id: UUID):
    return (
        (
            await session.execute(
                text(
                    "SELECT * FROM personal.library_entries WHERE user_id=:user AND media_id=:media FOR UPDATE"
                ),
                {"user": user_id, "media": media_id},
            )
        )
        .mappings()
        .one_or_none()
    )


async def create_entry(session: AsyncSession, user_id: UUID, media_id: UUID, status: str):
    return (
        await session.scalar(
            text(
                "INSERT INTO personal.library_entries(user_id,media_id,status,ever_completed) VALUES (:user,:media,:status,:completed) ON CONFLICT(user_id,media_id) DO NOTHING RETURNING media_id"
            ),
            {
                "user": user_id,
                "media": media_id,
                "status": status,
                "completed": status == "completed",
            },
        )
        is not None
    )


async def read_entry(session: AsyncSession, user_id: UUID, media_id: UUID) -> LibraryEntry:
    row = (
        (
            await session.execute(
                text(
                    f"SELECT e.*, {ACTIVE_SESSION}, m.payload FROM personal.library_entries e JOIN catalogue.media m ON m.id=e.media_id WHERE e.user_id=:user AND e.media_id=:media"
                ),
                {"user": user_id, "media": media_id},
            )
        )
        .mappings()
        .one()
    )
    return to_entry(row)


async def record_activity(
    session: AsyncSession,
    user_id: UUID,
    media_id: UUID | None,
    action: str,
    before: dict | None,
    after: dict,
):
    await session.execute(
        text(
            "INSERT INTO personal.activity(id,user_id,media_id,action,before_state,after_state) VALUES (:id,:user,:media,:action,CAST(:before AS jsonb),CAST(:after AS jsonb))"
        ),
        {
            "id": uuid4(),
            "user": user_id,
            "media": media_id,
            "action": action,
            "before": json.dumps(before, default=str) if before else None,
            "after": json.dumps(after, default=str),
        },
    )
