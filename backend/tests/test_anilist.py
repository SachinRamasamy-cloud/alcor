import asyncio
import os
from uuid import NAMESPACE_URL, uuid4, uuid5

import pytest

from app.infrastructure.database import Database
from app.integrations.metadata.anilist import map_media
from app.integrations.metadata.provider import DisabledProvider, FixtureProvider
from app.modules.catalogue.identity import resolve_media
from app.modules.discovery.routes import CandidateBatch, CandidateReference
from app.modules.discovery.service import DiscoveryService
from app.modules.library.schemas import LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.tracking.schemas import StartSession
from app.modules.tracking.service import TrackingService


def sample(source_id=999999900, mal_id=None):
    return map_media(
        {
            "id": source_id,
            "idMal": mal_id,
            "type": "ANIME",
            "title": {"english": "Identity regression"},
            "averageScore": 81,
            "episodes": 12,
            "isAdult": False,
        }
    )


def test_anilist_score_and_identity_are_not_mal_rank_or_votes():
    media = sample()
    assert media.score == 8.1
    assert media.popularity is None and media.rating_count is None
    assert media.external_id == "anilist:999999900"
    assert media.source.is_fixture is False


@pytest.mark.integration
@pytest.mark.skipif(
    os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local database opt-in required"
)
async def test_resolution_preserves_saved_history_and_cross_owner_exclusions():
    database = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        fixture = (await FixtureProvider().catalogue())[0]
        owner, other = uuid4(), uuid4()
        library = LibraryService(database, FixtureProvider())
        before = await library.change(owner, fixture.id, LibraryWrite(status="completed"))
        # Use the real MAL identity to simulate exact cross-provider reconciliation.
        source_id = 1900000000 + int(fixture.external_id)

        async def fetcher(_):
            return sample(source_id, int(fixture.external_id))

        results = await asyncio.gather(
            *(resolve_media(database, user, source_id, fetcher) for user in [owner, other, owner])
        )
        assert all(result.id == fixture.id for result in results)
        after = await library.list_entries(owner, None, 24, None)
        assert after.data[0].version == before.entry.version
        assert after.data[0].ever_completed
        assert (await library.list_entries(other, None, 24, None)).total == 0
        discovery = DiscoveryService(database, DisabledProvider())
        batch = CandidateBatch(
            mode="hide_watched",
            candidates=[
                CandidateReference(
                    anilist_id=source_id, mal_id=int(fixture.external_id), media_type="anime"
                )
            ],
        )
        assert await discovery.exclusions(owner, batch) == [source_id]
        assert await discovery.exclusions(other, batch) == []
    finally:
        await database.close()


@pytest.mark.integration
@pytest.mark.skipif(
    os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local database opt-in required"
)
async def test_new_anilist_title_can_save_and_track_without_legacy_provider():
    database = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        user = uuid4()

        async def fetcher(_):
            return sample()

        media = await resolve_media(database, user, 999999900, fetcher)
        saved = await LibraryService(database, DisabledProvider()).change(
            user, media.id, LibraryWrite(status="planned")
        )
        assert saved.entry.status == "planned"
        session = await TrackingService(database, DisabledProvider()).start(
            user,
            StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["1", "2", "10.5"]),
        )
        assert [unit.key for unit in session.units] == ["1", "2", "10.5"]
        assert not session.coverage_complete
    finally:
        await database.close()


@pytest.mark.integration
@pytest.mark.skipif(
    os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local database opt-in required"
)
async def test_concurrent_first_save_and_source_resolution_share_mal_identity():
    database = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        user = uuid4()
        mal_id = 900000000 + int(uuid4().hex[:7], 16)
        source_id = 1500000000 + int(uuid4().hex[:7], 16)
        canonical = uuid5(NAMESPACE_URL, f"mal:anime:{mal_id}")
        verified = sample(source_id, mal_id)
        legacy = verified.model_copy(
            update={"id": canonical, "external_id": str(mal_id), "source_ids": {}}
        )

        class Legacy(FixtureProvider):
            async def catalogue(self):
                return [legacy]

        async def fetcher(_):
            return verified

        resolved, saved = await asyncio.gather(
            resolve_media(database, user, source_id, fetcher),
            LibraryService(database, Legacy()).change(
                user, canonical, LibraryWrite(status="planned")
            ),
        )
        assert resolved.id == saved.entry.media.id == canonical
    finally:
        await database.close()
