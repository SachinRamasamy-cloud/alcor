import os
from uuid import uuid4

import pytest

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.library.schemas import LibraryDetails, LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.reporting.service import ReportingService
from app.modules.tracking.schemas import ProgressWrite, StartSession
from app.modules.tracking.service import TrackingService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


async def test_history_undo_is_private_versioned_idempotent_and_preserves_history():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        a, b = uuid4(), uuid4()
        library = LibraryService(db, FixtureProvider())
        report = ReportingService(db)
        media = (await FixtureProvider().catalogue())[0]
        await library.change(a, media.id, LibraryWrite(status="planned"))
        await library.details(a, media.id, LibraryDetails(expected_version=1, notes="First"))
        history = await report.history(a)
        action = next(r for r in history.data if r.action == "library.details")
        assert action.can_undo and not action.undone
        assert (await report.history(b)).data == []
        with pytest.raises(AppError) as forbidden:
            await report.undo(b, action.id, 2)
        assert forbidden.value.status == 404
        assert (await report.undo(a, action.id, 2))["changed"]
        assert not (await report.undo(a, action.id, 2))["changed"]
        entry = (await library.overlay(a, [media.id]))[0]
        assert entry.notes is None and entry.version == 3
        await library.details(a, media.id, LibraryDetails(expected_version=3, notes="Later"))
        later = next(
            r
            for r in (await report.history(a)).data
            if r.action == "library.details" and not r.undone
        )
        await library.details(a, media.id, LibraryDetails(expected_version=4, notes="Newer"))
        with pytest.raises(AppError) as conflict:
            await report.undo(a, later.id, 4)
        assert conflict.value.status == 409
        removed = await library.remove_library(a, media.id, 5)
        assert removed.entry.deleted_at is not None
        delete = next(r for r in (await report.history(a)).data if r.action == "library.removed")
        await report.undo(a, delete.id, 6)
        assert (await library.overlay(a, [media.id]))[0].notes == "Newer"
        page = await report.history(a, limit=2)
        second = await report.history(a, limit=2, cursor=page.next_cursor)
        assert not {r.id for r in page.data} & {r.id for r in second.data}
    finally:
        await db.close()


async def test_progress_undo_restores_gap_without_deleting_the_recorded_action():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        user = uuid4()
        media = (await FixtureProvider().catalogue())[0]
        tracking = TrackingService(db, FixtureProvider())
        report = ReportingService(db)
        created = await tracking.start(
            user, StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["1", "2"])
        )
        await tracking.update(
            user, created.id, ProgressWrite(expected_version=1, keys=["1"], state="watched")
        )
        activity = next(
            r for r in (await report.history(user)).data if r.action == "tracking.progress"
        )
        stats = await report.statistics(user)
        assert (
            stats["progress"]["unique_episodes"] == 1 and stats["estimated_watch_minutes"] is None
        )
        await report.undo(user, activity.id, 2)
        assert (await tracking.read(user, created.id)).summary.next_key == "1"
        assert any(r.id == activity.id and r.undone for r in (await report.history(user)).data)
    finally:
        await db.close()
