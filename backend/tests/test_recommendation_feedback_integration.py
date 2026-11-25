import asyncio
import os
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.discovery import feedback
from app.modules.discovery.routes import CandidateBatch, CandidateReference
from app.modules.discovery.schemas import FeedbackWrite
from app.modules.discovery.service import DiscoveryService
from app.modules.library import public as library
from app.modules.library.schemas import LibraryWrite
from app.modules.library.service import LibraryService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


@pytest.fixture
async def state():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    owner, other = uuid4(), uuid4()
    provider = FixtureProvider()
    titles = (await provider.catalogue())[:3]
    async with db.transaction(owner) as session:
        for item in titles:
            await library.ensure_media(session, item)
    yield db, owner, other, titles, provider
    await db.close()


def write(dismissed=True, version=0, context="favorites"):
    return FeedbackWrite(dismissed=dismissed, expected_version=version, context=context)


async def test_dismiss_restore_versions_ownership_and_no_consumption(state):
    db, owner, other, titles, provider = state
    # A test-only source mapping, never a claimed provider crosswalk.
    source_id = 1900000000 + int(str(owner.int)[-7:])
    title = titles[0].model_copy(
        update={
            "id": uuid4(),
            "external_id": f"anilist:{source_id}",
            "source_ids": {"anilist": str(source_id)},
        }
    )
    async with db.transaction(owner) as session:
        await library.ensure_media(session, title)
    candidate = CandidateReference(anilist_id=source_id, media_type=title.media_type)
    first = await feedback.write(db, owner, title.id, write())
    assert first.changed and first.dismissed and first.version == 1 and first.updated_at
    retry = await feedback.write(db, owner, title.id, write())
    assert not retry.changed and retry.version == 1
    absent = await feedback.write(db, other, title.id, write(False))
    assert not absent.changed and absent.version == 0
    assert (await feedback.page(db, other, 24, None)).data == []
    assert not (await feedback.read(db, other, [candidate]))[0].dismissed
    assert (await feedback.read(db, owner, [candidate]))[0].version == 1
    for mode in ("all", "hide_watched", "new_to_me"):
        body = CandidateBatch(candidates=[candidate], mode=mode, recommendation=True)
        assert await DiscoveryService(db, provider).exclusions(owner, body) == [source_id]
        assert await DiscoveryService(db, provider).exclusions(other, body) == []
    # Ordinary catalogue visibility does not inherit recommendation dismissal.
    assert (
        await DiscoveryService(db, provider).exclusions(
            owner, CandidateBatch(candidates=[candidate], mode="new_to_me")
        )
        == []
    )
    async with db.transaction(owner) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.library_entries")) == 0
        assert await session.scalar(text("SELECT count(*) FROM personal.tracking_sessions")) == 0
        assert (
            await session.scalar(
                text(
                    "SELECT count(*) FROM personal.activity WHERE action='recommendation.dismissed'"
                )
            )
            == 1
        )
    with pytest.raises(AppError) as stale:
        await feedback.write(db, owner, title.id, write(False, 0))
    assert stale.value.status == 409
    restored = await feedback.write(db, owner, title.id, write(False, 1, "management"))
    assert restored.changed and restored.version == 2 and not restored.dismissed
    assert (await feedback.page(db, owner, 24, None)).total == 0
    # History remains authoritative in personal modes after restoration.
    entries = LibraryService(db, provider)
    saved = await entries.change(owner, title.id, LibraryWrite(status="completed"))
    for mode in ("hide_watched", "new_to_me"):
        assert await DiscoveryService(db, provider).exclusions(
            owner, CandidateBatch(candidates=[candidate], mode=mode, recommendation=True)
        ) == [source_id]
    assert (
        await DiscoveryService(db, provider).exclusions(
            owner, CandidateBatch(candidates=[candidate], mode="all", recommendation=True)
        )
        == []
    )
    await feedback.write(db, owner, title.id, write(True, 2))
    current = (await entries.overlay(owner, [title.id]))[0]
    assert (
        current.version == saved.entry.version
        and current.ever_completed
        and current.status == "completed"
    )
    async with db.transaction(owner) as session:
        # Even an explicit foreign-owner predicate cannot escape forced RLS.
        assert (
            await session.scalar(
                text("SELECT count(*) FROM personal.recommendation_feedback WHERE user_id=:other"),
                {"other": other},
            )
            == 0
        )


async def test_feedback_concurrency_pagination_and_unknown_identity(state):
    db, owner, _, titles, _ = state
    outcomes = await asyncio.gather(
        *(feedback.write(db, owner, titles[0].id, write()) for _ in range(2))
    )
    assert sorted(item.changed for item in outcomes) == [False, True]
    for title in titles[1:]:
        await feedback.write(db, owner, title.id, write())
    first = await feedback.page(db, owner, 2, None)
    second = await feedback.page(db, owner, 2, first.next_cursor)
    assert first.total == second.total == 3
    assert len(first.data) == 2 and len(second.data) == 1 and second.next_cursor is None
    assert {item.media.id for item in first.data + second.data} == {title.id for title in titles}
    with pytest.raises(AppError) as invalid:
        await feedback.page(db, owner, 24, "invalid")
    assert invalid.value.code == "INVALID_CURSOR"
    with pytest.raises(AppError) as missing:
        await feedback.write(db, owner, uuid4(), write())
    assert missing.value.status == 404
    async with db.transaction(owner) as session:
        assert (
            await session.scalar(
                text(
                    "SELECT count(*) FROM personal.activity WHERE action='recommendation.dismissed'"
                )
            )
            == 3
        )
