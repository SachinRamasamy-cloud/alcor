from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import text

from app.core.errors import AppError
from app.integrations.metadata import anilist
from app.modules.library import public as repo


async def resolve_media(database, user, source_id: int, fetcher=anilist.fetch_media):
    # An already verified association needs no upstream request.
    async with database.transaction(user) as session:
        known = await session.scalar(
            text(
                "SELECT media_id FROM catalogue.source_ids WHERE namespace='anilist' AND external_id=:id"
            ),
            {"id": str(source_id)},
        )
        if known:
            return await repo.stored_media(session, known)
    verified = await fetcher(source_id)
    kind, identities = verified.media_type, verified.source_ids
    async with database.transaction(user) as session:
        # Serialize identity association across accounts, including a shared MAL
        # alias. A source disagreement is a reviewable conflict, never a merge.
        for namespace, external in sorted(identities.items()):
            await session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": f"{namespace}:{kind}:{external}"},
            )
        matches = set()
        for namespace, external in identities.items():
            match = await session.scalar(
                text(
                    "SELECT media_id FROM catalogue.source_ids WHERE namespace=:namespace AND media_type=:kind AND external_id=:external"
                ),
                {"namespace": namespace, "kind": kind, "external": external},
            )
            if match:
                matches.add(match)
        if identities.get("mal"):
            # Fixture records created after the migration still have a canonical
            # MAL UUID, so preserve them as well.
            legacy = await repo.stored_media(
                session, uuid5(NAMESPACE_URL, f"mal:{kind}:{identities['mal']}")
            )
            if legacy:
                matches.add(legacy.id)
        if len(matches) > 1:
            raise AppError(409, "IDENTITY_CONFLICT", "This title's identity needs review.")
        fallback = (
            uuid5(NAMESPACE_URL, f"mal:{kind}:{identities['mal']}")
            if identities.get("mal")
            else verified.id
        )
        canonical = next(iter(matches), fallback)
        stored = await repo.stored_media(session, canonical)
        media = stored or verified.model_copy(
            update={"id": canonical, "external_id": identities.get("mal") or verified.external_id}
        )
        await repo.ensure_media(session, media)
        for namespace, external in identities.items():
            await session.execute(
                text(
                    "INSERT INTO catalogue.source_ids(namespace,media_type,external_id,media_id) VALUES(:namespace,:kind,:external,:media) ON CONFLICT DO NOTHING"
                ),
                {"namespace": namespace, "kind": kind, "external": external, "media": canonical},
            )
        return media.model_copy(update={"source_ids": identities})
