import asyncio
import os
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.infrastructure.limits import RateLimiter
from app.integrations.metadata.provider import DisabledProvider, FixtureProvider
from app.modules.library.schemas import LibraryWrite, WishlistWrite
from app.modules.library.service import LibraryService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1",
        reason="Run local integration prerequisites and opt in",
    ),
]


@pytest.fixture
async def database():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    yield db
    await db.close()


async def test_wishlist_is_idempotent_and_start_is_atomic(database):
    service = LibraryService(database, FixtureProvider())
    user = uuid4()
    media = (await FixtureProvider().catalogue())[0]
    results = await asyncio.gather(
        *[
            service.change(user, media.id, LibraryWrite(status="planned"), WishlistWrite())
            for _ in range(4)
        ]
    )
    assert sum(r.changed for r in results) == 1
    wishlist = await service.list_entries(user, "planned", 24, None)
    assert wishlist.total == 1 and wishlist.data[0].version == 1
    changed = await service.change(
        user, media.id, LibraryWrite(status="in_progress", expected_version=1)
    )
    assert changed.entry.version == 2
    assert (await service.list_entries(user, "planned", 24, None)).total == 0
    assert (await service.list_entries(user, "in_progress", 24, None)).total == 1
    with pytest.raises(AppError) as conflict:
        await service.change(user, media.id, LibraryWrite(status="completed", expected_version=1))
    assert conflict.value.status == 409
    # Source outage cannot remove an already saved title or its personal state.
    unavailable = LibraryService(database, DisabledProvider())
    assert (await unavailable.list_entries(user, None, 24, None)).total == 1
    async with database.transaction(user) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.activity")) == 2
        assert (
            await session.scalar(
                text("SELECT count(*) FROM personal.tracking_sessions WHERE active")
            )
            == 1
        )


async def test_server_actions_and_active_sessions_are_owned_and_preserve_repeat_history(database):
    from app.modules.tracking.schemas import SessionVersion, StartSession
    from app.modules.tracking.service import TrackingService

    owner, other = uuid4(), uuid4()
    provider = FixtureProvider()
    service, tracking = LibraryService(database, provider), TrackingService(database, provider)
    media = next(item for item in await provider.catalogue() if item.media_type == "anime")
    planned = (await service.change(owner, media.id, LibraryWrite(status="planned"))).entry
    expected = {
        "planned": ["completed", "dropped", "in_progress", "not_interested"],
        "in_progress": ["completed", "dropped", "on_hold"],
        "on_hold": ["in_progress"], "dropped": ["in_progress"],
        "completed": [], "not_interested": [],
    }
    for status, actions in expected.items():
        assert planned.model_copy(update={"status": status}).allowed_statuses == actions
    assert planned.active_session is None
    started = (await service.change(owner, media.id, LibraryWrite(
        status="in_progress", expected_version=planned.version
    ))).entry
    assert started.active_session.kind == "initial"
    assert (await service.overlay(owner, [media.id]))[0].active_session == started.active_session
    assert await service.overlay(other, [media.id]) == []
    assert (await service.list_entries(other, None, 24, None)).data == []
    original = started.active_session
    await tracking.update(owner, original.id, SessionVersion(expected_version=original.version), complete=True)
    complete = (await service.overlay(owner, [media.id]))[0]
    assert complete.status == "completed" and complete.ever_completed
    assert complete.active_session is None and complete.allowed_statuses == []
    repeated = await tracking.start(owner, StartSession(media_id=media.id, request_id=uuid4(), repeat=True), "anime")
    repeat_entry = (await service.list_entries(owner, None, 24, None)).data[0]
    assert repeat_entry.ever_completed and repeat_entry.status == "in_progress"
    assert repeat_entry.active_session.kind == "repeat"
    assert repeat_entry.active_session.id == repeated.id != original.id
    sessions = await tracking.list(owner, media.id, "anime")
    assert {row["id"] for row in sessions} == {str(original.id), str(repeated.id)}
    removed = (await service.remove_library(owner, media.id, repeat_entry.version)).entry
    assert removed.allowed_statuses == [] and removed.ever_completed


async def test_real_rls_and_pooled_context_reset(database):
    service = LibraryService(database, FixtureProvider())
    first, second = uuid4(), uuid4()
    media = (await FixtureProvider().catalogue())[1]
    await service.change(first, media.id, LibraryWrite(status="completed"))
    assert (await service.list_entries(second, None, 24, None)).data == []
    async with database.transaction(second) as session:
        # Deliberately omit application owner predicates: DB policy must isolate.
        assert await session.scalar(text("SELECT count(*) FROM personal.library_entries")) == 0
        result = await session.execute(
            text("UPDATE personal.library_entries SET status='planned' WHERE user_id=:first"),
            {"first": first},
        )
        assert result.rowcount == 0
    async with database.engine.connect() as connection:
        assert await connection.scalar(text("SELECT count(*) FROM personal.library_entries")) == 0
        role = (
            await connection.execute(
                text("SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user")
            )
        ).one()
        assert role == (False, False)
    async with database.transaction(first) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.library_entries")) == 1


async def test_saved_overlay_uses_verified_source_mapping_and_owner(database):
    service = LibraryService(database, FixtureProvider())
    user, other = uuid4(), uuid4()
    from app.integrations.metadata.anilist import map_media
    from app.modules.library.repository import ensure_media
    source_id = 1900000000 + uuid4().int % 100000000
    media = map_media({"id": source_id, "type": "ANIME", "title": {"english": "Overlay fixture"}})
    async with database.transaction(user) as session:
        await ensure_media(session, media)
    await service.change(user, media.id, LibraryWrite(status="planned"))
    # Seeded identity map is authoritative, even when an older payload lacks it.
    async with database.transaction(user) as session:
        source = await session.scalar(text("SELECT external_id FROM catalogue.source_ids WHERE namespace='anilist' AND media_id=:id"), {"id": media.id})
    assert source is not None
    entries = await service.overlay(user, [], [int(source)])
    assert len(entries) == 1 and entries[0].media.id == media.id
    assert entries[0].media.source_ids["anilist"] == source
    assert await service.overlay(other, [], [int(source)]) == []
    assert await service.overlay(user, [], [2147483647]) == []
    assert len(await service.overlay(user, [media.id], [int(source)])) == 1


async def test_shared_redis_second_and_minute_budgets():
    a, b = RateLimiter("redis://127.0.0.1:56379/0"), RateLimiter("redis://127.0.0.1:56379/0")
    scope = f"test:{uuid4()}"
    try:
        results = await asyncio.gather(*[(a if i % 2 else b).check(scope, 4) for i in range(10)])
        assert results.count(0) == 4
        second = f"test:{uuid4()}"
        assert await a.check(second, 45, 2) == 0
        assert await b.check(second, 45, 2) == 0
        assert await a.check(second, 45, 2) > 0
    finally:
        await a.redis.delete(f"alcor:v1:limit:{scope}", f"alcor:v1:limit:{second}")
        await a.close()
        await b.close()
