import os
from uuid import uuid4

import pytest

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import DisabledProvider, FixtureProvider
from app.modules.discovery.schemas import FilterCreate, FilterUpdate, PersonalQuery
from app.modules.discovery.service import DiscoveryService
from app.modules.library.schemas import LibraryDetails, LibraryWrite
from app.modules.library.service import LibraryService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


async def test_personal_exclusion_before_page_and_owned_filter_presets():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        user, other = uuid4(), uuid4()
        provider = FixtureProvider()
        discovery = DiscoveryService(db, provider)
        library = LibraryService(db, provider)
        first = (await discovery.discover(user, PersonalQuery(limit=1, media_type="anime"))).data[0]
        await library.change(user, first.id, LibraryWrite(status="completed"))
        filtered = await discovery.discover(
            user, PersonalQuery(limit=1, media_type="anime", mode="hide_watched")
        )
        assert len(filtered.data) == 1 and filtered.data[0].id != first.id
        all_titles = await discovery.discover(user, PersonalQuery(media_type="anime"))
        assert all_titles.personal_status[str(first.id)].ever_completed
        await library.remove_library(user, first.id, 1)
        still_hidden = await discovery.discover(user, PersonalQuery(mode="hide_watched"))
        assert first.id not in {m.id for m in still_hidden.data}
        planned = next(m for m in await provider.catalogue() if m.id != first.id)
        await library.change(user, planned.id, LibraryWrite(status="planned"))
        await library.details(
            user, planned.id, LibraryDetails(expected_version=1, notes="remember amber telescope")
        )
        remembered = await discovery.discover(user, PersonalQuery(q="amber telescope", memory=True))
        assert [m.id for m in remembered.data] == [planned.id]
        assert remembered.source == "Saved library"
        offline_source = await DiscoveryService(db, DisabledProvider()).discover(
            user, PersonalQuery(q="amber telescope", memory=True)
        )
        assert [m.id for m in offline_source.data] == [planned.id]
        assert (
            await discovery.discover(other, PersonalQuery(q="amber telescope", memory=True))
        ).data == []
        body = FilterCreate(
            name="Fantasy",
            query=PersonalQuery(genre="Fantasy", mode="hide_watched"),
            request_id=uuid4(),
        )
        saved = await discovery.save_filter(user, body)
        assert (await discovery.save_filter(user, body)).id == saved.id
        assert await discovery.filters(other) == []
        with pytest.raises(AppError) as wrong_owner:
            await discovery.save_filter(
                other,
                FilterUpdate(name="Wrong", query=PersonalQuery(), expected_version=1),
                saved.id,
            )
        assert wrong_owner.value.status == 404
        await discovery.delete_filter(user, saved.id, 1)
        assert await discovery.filters(user) == []
    finally:
        await db.close()
