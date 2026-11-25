import os
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.library.schemas import LibraryDetails, LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.tracking.schemas import StartSession, UnitDetails
from app.modules.tracking.service import TrackingService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


async def test_title_details_private_versioned_and_noop():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        a, b = uuid4(), uuid4()
        media = (await FixtureProvider().catalogue())[0]
        service = LibraryService(db, FixtureProvider())
        await service.change(a, media.id, LibraryWrite(status="planned"))
        saved = await service.details(
            a,
            media.id,
            LibraryDetails(
                expected_version=1,
                rating=9,
                notes="Private note",
                favorite=True,
                tags=[" Favorite ", "Favorite"],
                priority="high",
                reason="Watch later",
            ),
        )
        assert (
            saved.entry.status == "planned"
            and saved.entry.rating == 9
            and saved.entry.tags == ["Favorite"]
        )
        assert saved.entry.version == 2
        noop = await service.details(a, media.id, LibraryDetails(expected_version=1, rating=9))
        assert not noop.changed and noop.entry.version == 2
        assert await service.overlay(b, [media.id]) == []
        assert (await service.overlay(a, [media.id]))[0].notes == "Private note"
        with pytest.raises(AppError) as conflict:
            await service.details(a, media.id, LibraryDetails(expected_version=1, notes="Stale"))
        assert conflict.value.status == 409
        with pytest.raises(AppError) as missing:
            await service.details(
                b, media.id, LibraryDetails(expected_version=2, notes="Wrong owner")
            )
        assert missing.value.status == 404
        with pytest.raises(ValidationError):
            LibraryDetails(expected_version=2, rating=11)
    finally:
        await db.close()


async def test_episode_note_does_not_mark_watched():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        a, b = uuid4(), uuid4()
        media = (await FixtureProvider().catalogue())[0]
        service = TrackingService(db, FixtureProvider())
        created = await service.start(
            a, StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["1"])
        )
        edited = await service.unit_details(
            a,
            created.id,
            "1",
            UnitDetails(expected_version=1, rating=8, notes="No progress implied"),
        )
        assert edited.summary.done == 0 and edited.summary.next_key == "1"
        assert edited.units[0].rating == 8 and edited.units[0].state == "unresolved"
        with pytest.raises(AppError) as missing:
            await service.unit_details(
                b, created.id, "1", UnitDetails(expected_version=2, notes="Wrong owner")
            )
        assert missing.value.status == 404
    finally:
        await db.close()
