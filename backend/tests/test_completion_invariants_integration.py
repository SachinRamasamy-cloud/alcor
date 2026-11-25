"""Independent remaining-plan X01/X02 oracles on disposable local identities."""

import os
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.library.schemas import LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.tracking.schemas import ProgressWrite, SessionVersion, StartSession
from app.modules.tracking.service import TrackingService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


@pytest.fixture
async def database():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    yield db
    await db.close()


async def isolated_provider(status):
    template = (await FixtureProvider().catalogue())[0]
    media = template.model_copy(update={
        "id": uuid4(), "external_id": f"remaining-{uuid4()}", "source_ids": {},
        "status": status, "total_units": 24,
    })

    class Provider(FixtureProvider):
        async def catalogue(self):
            return [media]

    return Provider(), media


async def test_known_ongoing_manual_completion_keeps_progress_and_session_active(database):
    provider, media = await isolated_provider("RELEASING")
    user = uuid4()
    tracker = TrackingService(database, provider)
    started = await tracker.start(user, StartSession(
        media_id=media.id, request_id=uuid4(), manual_labels=[str(i) for i in range(1, 9)]
    ))
    marked = await tracker.update(user, started.id, ProgressWrite(
        expected_version=started.version, keys=[str(i) for i in range(1, 9)], state="watched"
    ))
    assert marked.summary.done == 8 and marked.active
    with pytest.raises(AppError) as denied:
        await tracker.update(user, started.id, SessionVersion(expected_version=marked.version), complete=True)
    assert (denied.value.status, denied.value.code) == (422, "COMPLETION_UNAVAILABLE")
    current = await tracker.read(user, started.id)
    assert current.active and current.version == marked.version and current.summary.done == 8
    entry = (await LibraryService(database, provider).overlay(user, [media.id]))[0]
    assert entry.status == "in_progress" and not entry.ever_completed


async def test_library_completion_cannot_bypass_active_versioned_session(database):
    provider, media = await isolated_provider("FINISHED")
    user = uuid4()
    tracker, library = TrackingService(database, provider), LibraryService(database, provider)
    started = await tracker.start(user, StartSession(
        media_id=media.id, request_id=uuid4(), manual_labels=["1", "2"]
    ))
    entry = (await library.overlay(user, [media.id]))[0]
    with pytest.raises(AppError) as denied:
        await library.change(user, media.id, LibraryWrite(status="completed", expected_version=entry.version))
    assert (denied.value.status, denied.value.code) == (409, "COMPLETION_REQUIRES_SESSION")
    assert (await tracker.read(user, started.id)).active
    assert not (await library.overlay(user, [media.id]))[0].ever_completed


@pytest.mark.parametrize("status", ["FINISHED", None])
async def test_historical_assertion_is_explicit_and_retry_does_not_create_marks(database, status):
    provider, media = await isolated_provider(status)
    user = uuid4()
    library = LibraryService(database, provider)
    result = await library.change(user, media.id, LibraryWrite(status="completed"))
    retry = await library.change(user, media.id, LibraryWrite(status="completed"))
    assert result.changed and not retry.changed and retry.entry.version == result.entry.version
    assert result.entry.ever_completed
    async with database.transaction(user) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.tracking_sessions WHERE user_id=:user"), {"user": user}) == 0
        assert await session.scalar(text("SELECT count(*) FROM personal.activity WHERE user_id=:user"), {"user": user}) == 1


@pytest.mark.parametrize("status", ["RELEASING", "NOT_YET_RELEASED", "Publishing"])
async def test_blocked_library_assertion_rolls_back_new_entry(database, status):
    provider, media = await isolated_provider(status)
    user = uuid4()
    library = LibraryService(database, provider)
    with pytest.raises(AppError) as denied:
        await library.change(user, media.id, LibraryWrite(status="completed"))
    assert denied.value.code == "COMPLETION_UNAVAILABLE"
    assert await library.overlay(user, [media.id]) == []


@pytest.mark.parametrize("status,finishes", [(None, False), ("RELEASING", False), ("FINISHED", True)])
async def test_final_coverage_needs_finished_release_and_preserves_exact_marks(database, status, finishes):
    provider, media = await isolated_provider(status)
    user = uuid4()
    tracker = TrackingService(database, provider)
    started = await tracker.start(user, StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["1", "2"]))
    async with database.transaction(user) as session:
        await session.execute(text("UPDATE personal.tracking_sessions SET coverage_complete=true,final_total=2 WHERE user_id=:user AND id=:id"), {"user": user, "id": started.id})
    result = await tracker.update(user, started.id, ProgressWrite(expected_version=started.version, keys=["1", "2"], state="watched"))
    assert result.summary.done == 2 and result.summary.completed == finishes and result.active != finishes
    assert result.summary.caught_up != finishes
    entry = (await LibraryService(database, provider).overlay(user, [media.id]))[0]
    assert entry.ever_completed == finishes
    assert "completed" not in entry.allowed_statuses


async def test_session_completion_rejects_foreign_and_stale_versions_before_commit(database):
    provider, media = await isolated_provider("FINISHED")
    user = uuid4()
    tracker = TrackingService(database, provider)
    started = await tracker.start(user, StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["1"]))
    with pytest.raises(AppError) as denied:
        await tracker.update(uuid4(), started.id, SessionVersion(expected_version=1), complete=True)
    assert denied.value.status == 404
    with pytest.raises(AppError) as stale:
        await tracker.update(user, started.id, SessionVersion(expected_version=2), complete=True)
    assert stale.value.status == 409
    completed = await tracker.update(user, started.id, SessionVersion(expected_version=1), complete=True)
    assert not completed.active and completed.summary.done == 0
