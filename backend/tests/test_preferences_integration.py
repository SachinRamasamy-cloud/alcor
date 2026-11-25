import os
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.modules.preferences.schemas import (
    IntelligenceProfile,
    Preferences,
    PreferencesWrite,
    ProfileWrite,
    SetupWrite,
)
from app.modules.preferences.service import PreferenceService

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local PostgreSQL opt-in required"
    ),
]


async def test_preferences_and_profile_owned_and_versioned():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        a, b = uuid4(), uuid4()
        service = PreferenceService(db)
        assert (await service.read(a)).version == 0
        saved = await service.write(
            a,
            PreferencesWrite(
                expected_version=0,
                data=Preferences(
                    timezone="Asia/Kolkata", preferred_genres=["Fantasy"], notifications=True
                ),
            ),
        )
        assert saved.version == 1 and saved.data.timezone == "Asia/Kolkata"
        assert (await service.read(b)).data.preferred_genres == []
        with pytest.raises(AppError) as conflict:
            await service.write(a, PreferencesWrite(expected_version=0, data=Preferences()))
        assert conflict.value.status == 409
        await service.update_profile(
            a, ProfileWrite(expected_version=0, display_name=" ALCOR reader ")
        )
        assert (await service.profile(a)).display_name == "ALCOR reader"
        assert (await service.profile(b)).display_name == ""
        with pytest.raises(ValidationError):
            Preferences(timezone="not-a-timezone")
    finally:
        await db.close()


async def test_setup_is_atomic_owned_and_does_not_invent_watch_history():
    from sqlalchemy import text

    from app.integrations.metadata.provider import FixtureProvider
    from app.modules.library import public as library

    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        owner, other = uuid4(), uuid4()
        media = next(
            item for item in await FixtureProvider().catalogue() if item.media_type == "anime"
        )
        async with db.transaction(owner) as session:
            await library.ensure_media(session, media)
        service = PreferenceService(db)
        data = Preferences(
            timezone="Asia/Kolkata",
            preferred_genres=["Fantasy"],
            intelligence_profile=IntelligenceProfile(
                started_year=2020,
                favorite_anime_ids=[media.id],
                disliked_genres=["Comedy"],
                excluded_genres=["Romance"],
            ),
        )
        saved = await service.save_setup(
            owner,
            SetupWrite(
                display_name=" Reader ",
                expected_profile_version=0,
                expected_preferences_version=0,
                data=data,
            ),
        )
        assert saved.profile.display_name == "Reader" and saved.preferences.version == 1
        assert [item.id for item in saved.favorites] == [media.id]
        assert (await service.setup(other)).favorites == []
        async with db.transaction(owner) as session:
            assert (
                await session.scalar(
                    text("SELECT count(*) FROM personal.library_entries WHERE user_id=:user"),
                    {"user": owner},
                )
                == 0
            )
        with pytest.raises(AppError) as conflict:
            await service.save_setup(
                owner,
                SetupWrite(
                    display_name="Stale",
                    expected_profile_version=0,
                    expected_preferences_version=1,
                    data=Preferences(intelligence_profile=IntelligenceProfile()),
                ),
            )
        assert conflict.value.status == 409
        unchanged = await service.setup(owner)
        assert (
            unchanged.profile.display_name == "Reader"
            and unchanged.preferences.data.preferred_genres == ["Fantasy"]
        )
        # Older preference clients must not erase an omitted new profile field.
        await service.write(
            owner,
            PreferencesWrite(expected_version=1, data=Preferences(preferred_genres=["Action"])),
        )
        assert (await service.read(owner)).data.intelligence_profile.favorite_anime_ids == [
            media.id
        ]
    finally:
        await db.close()


async def test_setup_rejects_unverified_favorites_through_both_write_paths():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        owner, service = uuid4(), PreferenceService(db)
        data = Preferences(intelligence_profile=IntelligenceProfile(favorite_anime_ids=[uuid4()]))
        with pytest.raises(AppError) as invalid:
            await service.save_setup(
                owner,
                SetupWrite(
                    display_name="Invalid",
                    expected_profile_version=0,
                    expected_preferences_version=0,
                    data=data,
                ),
            )
        assert invalid.value.status == 422
        assert (await service.profile(owner)).version == 0
        assert (await service.read(owner)).version == 0
        with pytest.raises(AppError):
            await service.write(owner, PreferencesWrite(expected_version=0, data=data))
        with pytest.raises(ValidationError):
            IntelligenceProfile(disliked_genres=["Romance"], excluded_genres=["romance"])
        from datetime import date

        with pytest.raises(ValidationError):
            IntelligenceProfile(started_year=date.today().year + 1)
    finally:
        await db.close()


async def test_discovery_mode_is_owned_versioned_and_preserved_for_older_clients():
    db = Database("postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor")
    try:
        owner, other = uuid4(), uuid4()
        service = PreferenceService(db)
        assert (await service.read(owner)).data.discovery_mode == "new_to_me"
        saved = await service.write(
            owner, PreferencesWrite(expected_version=0, data=Preferences(discovery_mode="hide_watched"))
        )
        assert saved.version == 1
        assert (await service.read(owner)).data.discovery_mode == "hide_watched"
        assert (await service.read(other)).data.discovery_mode == "new_to_me"
        legacy = await service.write(
            owner, PreferencesWrite(expected_version=1, data=Preferences(timezone="Asia/Kolkata"))
        )
        assert legacy.data.discovery_mode == "hide_watched"
        setup = await service.save_setup(owner, SetupWrite(
            display_name="Reader", expected_profile_version=0,
            expected_preferences_version=legacy.version,
            data=Preferences(intelligence_profile=IntelligenceProfile()),
        ))
        assert setup.preferences.data.discovery_mode == "hide_watched"
        with pytest.raises(AppError) as conflict:
            await service.write(owner, PreferencesWrite(expected_version=0, data=Preferences(discovery_mode="all")))
        assert conflict.value.status == 409
        assert (await service.read(owner)).data.discovery_mode == "hide_watched"
        with pytest.raises(ValidationError):
            Preferences(discovery_mode="invalid")
    finally:
        await db.close()
