import asyncio
import os
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy import text

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.integrations.metadata.provider import FixtureProvider
from app.modules.discovery.schemas import PersonalQuery
from app.modules.discovery.service import DiscoveryService
from app.modules.library import public as library
from app.modules.library.schemas import LibraryDetails, LibraryWrite
from app.modules.library.service import LibraryService
from app.modules.preferences.schemas import (
    FavoriteWrite,
    IntelligenceProfile,
    Preferences,
    PreferencesWrite,
    SetupWrite,
)
from app.modules.preferences.service import PreferenceService
from app.modules.reporting.service import ReportingService

pytestmark = [pytest.mark.integration, pytest.mark.skipif(
    os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
)]


@pytest.fixture
async def state():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    provider = FixtureProvider()
    media = await provider.catalogue()
    anime = next(item for item in media if item.media_type == "anime")
    other = next(item for item in media if item.id != anime.id)
    third = next(item for item in media if item.id not in {anime.id, other.id})
    owner = uuid4()
    async with db.transaction(owner) as session:
        for item in (anime, other, third):
            await library.ensure_media(session, item)
    yield db, owner, anime, other, third, LibraryService(db, provider), PreferenceService(db)
    await db.close()


async def legacy_preferences(db, owner, anime):
    payload = Preferences(intelligence_profile=IntelligenceProfile(favorite_anime_ids=[anime.id]))
    async with db.transaction(owner) as session:
        await session.execute(text("""
            INSERT INTO personal.user_preferences(user_id,payload,version)
            VALUES(:user,CAST(:payload AS jsonb),1)
        """), {"user": owner, "payload": payload.model_dump_json()})


async def test_legacy_union_removal_and_old_client_preservation(state):
    db, owner, a, b, _, entries, prefs = state
    for item in (a, b):
        await entries.change(owner, item.id, LibraryWrite(status="planned"))
    await legacy_preferences(db, owner, a)
    async with db.transaction(owner) as session:
        await session.execute(text("UPDATE personal.library_entries SET favorite=true WHERE user_id=:user"), {"user": owner})
    initial = await prefs.favorite_page(owner)
    assert {item.id for item in initial.data} == {a.id, b.id} and initial.total == 2
    assert initial.preferences_version == 1
    before = await prefs.setup(owner)
    removed = await prefs.set_favorite(owner, a.id, FavoriteWrite(favorite=False, expected_preferences_version=1))
    assert removed.changed and removed.preferences_version == 2
    retried = await prefs.set_favorite(owner, a.id, FavoriteWrite(favorite=False, expected_preferences_version=1))
    assert not retried.changed and retried.preferences_version == 2
    assert [item.id for item in (await prefs.favorite_page(owner)).data] == [b.id]
    assert (await prefs.setup(owner)).favorites == []
    with pytest.raises(AppError) as stale_setup:
        await prefs.save_setup(owner, SetupWrite(display_name="Old draft", expected_profile_version=0,
            expected_preferences_version=1, data=before.preferences.data))
    assert stale_setup.value.status == 409
    with pytest.raises(AppError) as stale_detail:
        await entries.details(owner, a.id, LibraryDetails(expected_version=1, favorite=True))
    assert stale_detail.value.status == 409
    saved = await prefs.write(owner, PreferencesWrite(expected_version=2, data=Preferences(timezone="Asia/Kolkata")))
    assert saved.data.favorite_media_ids == [b.id]
    with pytest.raises(AppError) as reset:
        await prefs.write(owner, PreferencesWrite(expected_version=saved.version, data=Preferences(favorite_media_ids=None)))
    assert reset.value.status == 422
    current = (await entries.overlay(owner, [a.id]))[0]
    assert not current.favorite and current.status == "planned" and not current.ever_completed
    async with db.transaction(owner) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.unit_progress")) == 0


async def test_unrecorded_favorites_are_verified_owned_and_paginated_without_consumption(state):
    db, owner, a, b, c, entries, prefs = state
    version = 0
    for item in (a, b, c):
        result = await prefs.set_favorite(owner, item.id, FavoriteWrite(favorite=True, expected_preferences_version=version))
        version = result.preferences_version
    first = await prefs.favorite_page(owner, limit=2)
    second = await prefs.favorite_page(owner, limit=2, cursor=first.next_cursor)
    assert len(first.data) == 2 and len(second.data) == 1
    assert len({m.id for m in first.data + second.data}) == 3
    assert first.total == second.total == 3 and second.next_cursor is None
    assert [m.id for m in (await prefs.favorite_page(owner, ids=[c.id])).data] == [c.id]
    stranger = uuid4()
    assert (await prefs.favorite_page(stranger, ids=[a.id])).data == []
    assert (await entries.list_entries(owner, None, 24, None)).total == 0
    stats = await ReportingService(db).statistics(owner)
    assert stats["library"]["favorites"] == 3 and stats["library"]["ever_completed"] == 0
    saved = await entries.change(owner, a.id, LibraryWrite(status="planned"))
    assert saved.entry.favorite and not saved.entry.ever_completed
    memory = await DiscoveryService(db, FixtureProvider()).discover(owner, PersonalQuery(memory=True))
    assert memory.personal_status[str(a.id)].favorite
    async with db.transaction(owner) as session:
        assert await session.scalar(text("SELECT count(*) FROM personal.tracking_sessions")) == 0
        assert await session.scalar(text("SELECT count(*) FROM personal.unit_progress")) == 0
    with pytest.raises(AppError) as invalid:
        await prefs.set_favorite(owner, uuid4(), FavoriteWrite(favorite=True, expected_preferences_version=version))
    assert invalid.value.status == 404
    assert (await prefs.read(owner)).version == version
    with pytest.raises(ValidationError):
        Preferences(favorite_media_ids=[uuid4() for _ in range(1001)])


async def test_setup_preserves_outside_favorites_and_can_deliberately_readd_removed_selection(state):
    db, owner, a, b, _, entries, prefs = state
    await legacy_preferences(db, owner, a)
    await prefs.set_favorite(owner, b.id, FavoriteWrite(favorite=True, expected_preferences_version=1))
    assert (await entries.list_entries(owner, None, 24, None)).total == 0
    current = await prefs.setup(owner)
    edited = current.preferences.data.model_copy(update={"intelligence_profile": IntelligenceProfile()})
    saved = await prefs.save_setup(owner, SetupWrite(display_name="Reader", expected_profile_version=0,
        expected_preferences_version=current.preferences.version, data=edited))
    assert saved.preferences.data.favorite_media_ids == [b.id]
    chosen = saved.preferences.data.model_copy(update={"intelligence_profile": IntelligenceProfile(favorite_anime_ids=[a.id])})
    await prefs.save_setup(owner, SetupWrite(display_name="Reader", expected_profile_version=saved.profile.version,
        expected_preferences_version=saved.preferences.version, data=chosen))
    assert {m.id for m in (await prefs.favorite_page(owner)).data} == {a.id, b.id}


async def test_favorite_undo_restores_both_sources_and_rejects_changed_preferences_atomically(state):
    db, owner, a, _, _, entries, prefs = state
    await entries.change(owner, a.id, LibraryWrite(status="planned"))
    await legacy_preferences(db, owner, a)
    assert (await entries.overlay(owner, [a.id]))[0].favorite
    removed = await entries.details(owner, a.id, LibraryDetails(expected_version=1, favorite=False))
    report = ReportingService(db)
    action = next(item for item in (await report.history(owner, limit=100)).data if item.action == "library.details")
    await report.undo(owner, action.id, removed.entry.version)
    assert (await prefs.favorite_page(owner)).data[0].id == a.id
    assert (await prefs.setup(owner)).favorites[0].id == a.id
    assert (await entries.overlay(owner, [a.id]))[0].favorite
    assert not (await report.undo(owner, action.id, removed.entry.version))["changed"]
    current = await prefs.read(owner)
    await prefs.set_favorite(owner, a.id, FavoriteWrite(favorite=False, expected_preferences_version=current.version))
    action = next(item for item in (await report.history(owner, limit=100)).data if item.action == "library.details")
    library_version = (await entries.overlay(owner, [a.id]))[0].version
    current = await prefs.read(owner)
    updated = await prefs.write(owner, PreferencesWrite(expected_version=current.version,
        data=current.data.model_copy(update={"timezone": "Asia/Kolkata"})))
    with pytest.raises(AppError) as conflict:
        await report.undo(owner, action.id, library_version)
    assert conflict.value.status == 409
    assert (await prefs.favorite_page(owner)).data == []
    assert (await prefs.read(owner)).version == updated.version
    assert (await entries.overlay(owner, [a.id]))[0].version == library_version
    notes = await entries.details(owner, a.id, LibraryDetails(expected_version=library_version, notes="Temporary note"))
    note_action = next(item for item in (await report.history(owner, limit=100)).data
                       if item.action == "library.details" and item.expected_version == notes.entry.version)
    current = await prefs.read(owner)
    unrelated = await prefs.write(owner, PreferencesWrite(expected_version=current.version,
        data=current.data.model_copy(update={"notifications": True})))
    await report.undo(owner, note_action.id, notes.entry.version)
    assert (await entries.overlay(owner, [a.id]))[0].notes is None
    assert (await prefs.read(owner)).version == unrelated.version
    assert (await prefs.favorite_page(owner)).data == []


async def test_concurrent_favorite_changes_have_one_winner_without_lost_updates(state):
    _, owner, a, b, _, _, prefs = state
    a_result = await prefs.set_favorite(owner, a.id, FavoriteWrite(favorite=True, expected_preferences_version=0))
    b_result = await prefs.set_favorite(owner, b.id, FavoriteWrite(favorite=True, expected_preferences_version=a_result.preferences_version))
    results = await asyncio.wait_for(asyncio.gather(*[
        prefs.set_favorite(owner, item.id, FavoriteWrite(favorite=False, expected_preferences_version=b_result.preferences_version))
        for item in (a, b)
    ], return_exceptions=True), timeout=10)
    assert sum(isinstance(value, AppError) and value.status == 409 for value in results) == 1
    assert sum(not isinstance(value, Exception) and value.changed for value in results) == 1
    assert (await prefs.favorite_page(owner)).total == 1
