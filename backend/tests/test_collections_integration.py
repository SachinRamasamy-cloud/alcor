import os
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.collections.schemas import CollectionCreate, ItemWrite
from app.modules.collections.service import CollectionService
from app.modules.library.schemas import LibraryWrite
from app.modules.library.service import LibraryService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


async def test_collection_lifecycle_isolated_and_independent_of_history():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        service = CollectionService(db, FixtureProvider())
        a, b = uuid4(), uuid4()
        body = CollectionCreate(name="Favorites", request_id=uuid4())
        created = await service.create(a, body)
        assert (await service.create(a, body)).id == created.id
        media = (await FixtureProvider().catalogue())[0]
        await LibraryService(db, FixtureProvider()).change(
            a, media.id, LibraryWrite(status="completed")
        )
        saved = await service.item(
            a, created.id, media.id, ItemWrite(expected_version=created.version, position=3)
        )
        assert saved.total == 1 and saved.items[0].position == 3
        same = await service.item(
            a, created.id, media.id, ItemWrite(expected_version=saved.version, position=3)
        )
        assert same.version == saved.version
        with pytest.raises(AppError) as conflict:
            await service.update(a, created.id, 1, "Renamed")
        assert conflict.value.status == 409
        with pytest.raises(AppError) as missing:
            await service.read(b, created.id)
        assert missing.value.status == 404
        async with db.transaction(b) as session:
            assert await session.scalar(text("SELECT count(*) FROM personal.collection_items")) == 0
        renamed = await service.update(a, created.id, saved.version, "Renamed")
        await service.update(a, created.id, renamed.version, delete=True)
        assert (await service.list(a))["data"] == []
        library = await LibraryService(db, FixtureProvider()).list_entries(a, None, 24, None)
        assert library.data[0].ever_completed and library.data[0].status == "completed"
    finally:
        await db.close()
