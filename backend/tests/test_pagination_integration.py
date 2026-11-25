import os
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.collections.service import CollectionService
from app.modules.library.schemas import LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.reporting.service import ReportingService
from app.modules.tracking.schemas import StartSession
from app.modules.tracking.service import TrackingService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


async def test_numbered_private_pages_have_real_totals_and_remain_owned():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        user, other = uuid4(), uuid4()
        provider = FixtureProvider()
        library = LibraryService(db, provider)
        for media in (await provider.catalogue())[:6]:
            await library.change(user, media.id, LibraryWrite(status="planned"))
        pages = [await library.list_entries(user, "planned", 2, None, page) for page in [1, 2, 3]]
        assert all(page.total == 6 and page.total_pages == 3 for page in pages)
        assert len({entry.media.id for page in pages for entry in page.data}) == 6
        assert pages[2].next_cursor is None
        assert (await library.list_entries(other, None, 2, None, 2)).total == 0
        reporting = ReportingService(db)
        first = await reporting.history(user, 2, page=1)
        last = await reporting.history(user, 2, page=3)
        assert first.total == last.total == 6 and last.total_pages == 3
        assert {r.id for r in first.data}.isdisjoint({r.id for r in last.data})
        assert (await reporting.history(other, 2, page=2)).data == []
        async with db.transaction(user) as session:
            await session.execute(
                text(
                    "INSERT INTO personal.collections(id,user_id,name,request_id) VALUES(:id,:user,:name,:request)"
                ),
                [
                    {"id": uuid4(), "user": user, "name": f"Collection {n}", "request": uuid4()}
                    for n in range(105)
                ],
            )
        collections = CollectionService(db, provider)
        second = await collections.list(user, page=2)
        assert second["total"] == 105 and second["total_pages"] == 2 and len(second["data"]) == 5
        assert second["next_cursor"] is None
        assert (await collections.list(other, page=2))["data"] == []
        tracker = TrackingService(db, provider)
        media = (await provider.catalogue())[7]
        session = await tracker.start(
            user,
            StartSession(
                media_id=media.id, request_id=uuid4(), manual_labels=[str(n) for n in range(1, 102)]
            ),
        )
        assert session.total_units == 101 and len(session.units) == 100
        final = await tracker.read(user, session.id, 100)
        assert (
            final.total_units == 101 and final.units[0].key == "101" and final.next_offset is None
        )
    finally:
        await db.close()
