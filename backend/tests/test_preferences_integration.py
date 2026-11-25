import os
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.core.errors import AppError
from app.infrastructure.database import Database
from app.modules.preferences.schemas import Preferences, PreferencesWrite, ProfileWrite
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
