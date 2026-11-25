import os
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.library.service import LibraryService
from app.modules.tracking.schemas import ManualTargets, ProgressWrite, SessionVersion, StartSession
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


async def test_exact_bulk_gaps_versions_repeat_and_history(database):
    user = uuid4()
    media = (await FixtureProvider().catalogue())[0]
    service = TrackingService(database, FixtureProvider())
    body = StartSession(
        media_id=media.id, request_id=uuid4(), manual_labels=[str(i) for i in range(1, 13)]
    )
    initial = await service.start(user, body)
    assert (await service.start(user, body)).id == initial.id
    changed = await service.update(
        user,
        initial.id,
        ProgressWrite(
            expected_version=1,
            keys=["1", "2", "3", "4", "6", "7", "8", "10", "11"],
            state="watched",
        ),
    )
    changed = await service.update(
        user,
        initial.id,
        ProgressWrite(expected_version=changed.version, keys=["5"], state="skipped"),
    )
    assert (
        changed.summary.done,
        changed.summary.skipped,
        changed.summary.remaining,
        changed.summary.next_key,
    ) == (9, 1, 2, "9")
    assert not changed.summary.completed and not changed.coverage_complete
    with pytest.raises(AppError) as conflict:
        await service.update(
            user, initial.id, ProgressWrite(expected_version=1, keys=["9"], state="watched")
        )
    assert conflict.value.status == 409
    finished = await service.update(
        user, initial.id, SessionVersion(expected_version=changed.version), complete=True
    )
    assert not finished.active
    repeated = await service.start(
        user,
        StartSession(media_id=media.id, request_id=uuid4(), repeat=True, manual_labels=["1", "2"]),
    )
    assert repeated.id != initial.id and repeated.summary.done == 0
    assert (await service.read(user, initial.id)).summary.done == 9
    entries = await LibraryService(database, FixtureProvider()).list_entries(user, None, 24, None)
    assert entries.data[0].ever_completed and entries.data[0].status == "in_progress"
    queue = await service.continue_queue(user, "anime")
    assert len(queue) == 1 and queue[0]["session_id"] == str(repeated.id)
    assert queue[0]["summary"]["next_key"] == "1"
    async with database.transaction(user) as session:
        assert (
            await session.scalar(
                text("SELECT count(*) FROM personal.activity WHERE action='tracking.progress'")
            )
            == 2
        )


async def test_rls_cross_reference_and_chapter_identity(database):
    a, b = uuid4(), uuid4()
    media = next(m for m in await FixtureProvider().catalogue() if m.media_type == "manga")
    service = TrackingService(database, FixtureProvider())
    created = await service.start(
        a, StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["10.5", "bonus"])
    )
    assert [u.key for u in created.units] == ["10.5", "bonus"]
    with pytest.raises(AppError) as missing:
        await service.read(b, created.id)
    assert missing.value.status == 404
    async with database.transaction(b) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.tracking_sessions")) == 0
    with pytest.raises(IntegrityError):
        async with database.transaction(b) as session:
            await session.execute(
                text(
                    "INSERT INTO personal.unit_progress(user_id,session_id,media_id,unit_key,state) VALUES (:user,:session,:media,'10.5','read')"
                ),
                {"user": b, "session": created.id, "media": media.id},
            )
    updated = await service.update(
        a, created.id, ProgressWrite(expected_version=1, keys=["10.50"], state="read")
    )
    assert updated.summary.done == 1 and updated.summary.next_key == "bonus"
    with pytest.raises(ValidationError):
        StartSession(media_id=media.id, request_id=uuid4(), manual_labels=["10.5", "10.50"])


async def test_manual_append_preserves_marks_and_paginates(database):
    user = uuid4()
    media = (await FixtureProvider().catalogue())[2]
    service = TrackingService(database, FixtureProvider())
    created = await service.start(
        user,
        StartSession(
            media_id=media.id, request_id=uuid4(), manual_labels=[str(i) for i in range(1, 151)]
        ),
    )
    assert len(created.units) == 100 and created.next_offset == 100
    assert len((await service.read(user, created.id, 100)).units) == 50
    marked = await service.update(
        user, created.id, ProgressWrite(expected_version=1, keys=["1"], state="watched")
    )
    appended = await service.add_manual(
        user,
        ManualTargets(
            media_id=media.id,
            session_id=created.id,
            request_id=uuid4(),
            expected_version=marked.version,
            manual_labels=["151", "152"],
        ),
    )
    assert appended.summary.done == 1 and appended.summary.remaining == 151
    assert appended.final_total is None and not appended.coverage_complete
