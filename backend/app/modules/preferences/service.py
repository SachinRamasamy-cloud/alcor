import base64
import binascii
from uuid import UUID

from sqlalchemy import text

from app.core.errors import AppError
from app.modules.library import public as library
from app.modules.preferences import favorites as favorite_state
from app.modules.preferences.schemas import (
    FavoritesPage,
    Preferences,
    PreferencesRead,
    ProfileRead,
    SetupRead,
)


async def verified_favorites(session, data, effective=True):
    ids = data.intelligence_profile.favorite_anime_ids if data.intelligence_profile else []
    if effective and data.favorite_media_ids is not None:
        ids = [media_id for media_id in ids if media_id in data.favorite_media_ids]
    favorites = []
    for media_id in ids:
        media = await library.stored_media(session, media_id)
        if media is None or media.media_type != "anime":
            raise AppError(422, "INVALID_REQUEST", "Choose a verified anime favorite.")
        favorites.append(media)
    return favorites


class PreferenceService:
    def __init__(self, database):
        self.database = database

    async def read(self, user):
        async with self.database.transaction(user) as session:
            row = (
                (
                    await session.execute(
                        text(
                            "SELECT payload,version FROM personal.user_preferences WHERE user_id=:user"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one_or_none()
            )
            return PreferencesRead(
                data=Preferences.model_validate(row["payload"]) if row else Preferences(),
                version=row["version"] if row else 0,
            )

    async def write(self, user, body):
        async with self.database.transaction(user) as session:
            await session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": "preferences:" + str(user)},
            )
            row = (
                (
                    await session.execute(
                        text(
                            "SELECT * FROM personal.user_preferences WHERE user_id=:user FOR UPDATE"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one_or_none()
            )
            current = row["version"] if row else 0
            if current != body.expected_version:
                raise AppError(409, "CONFLICT", "Review the latest preferences.")
            if row and "intelligence_profile" not in body.data.model_fields_set:
                body.data = body.data.model_copy(
                    update={
                        "intelligence_profile": Preferences.model_validate(
                            row["payload"]
                        ).intelligence_profile
                    }
                )
            if row and "discovery_mode" not in body.data.model_fields_set:
                body.data = body.data.model_copy(
                    update={"discovery_mode": Preferences.model_validate(row["payload"]).discovery_mode}
                )
            await verified_favorites(session, body.data, effective=False)
            body.data = await favorite_state.prepare_preferences(
                session, user,
                PreferencesRead(data=Preferences.model_validate(row["payload"]) if row else Preferences(), version=current),
                body.data,
            )
            if row and Preferences.model_validate(row["payload"]) == body.data:
                return PreferencesRead(data=body.data, version=current)
            await session.execute(
                text(
                    "INSERT INTO personal.user_preferences(user_id,payload,version) VALUES(:user,CAST(:payload AS jsonb),1) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,version=personal.user_preferences.version+1"
                ),
                {"user": user, "payload": body.data.model_dump_json()},
            )
            await library.record_activity(
                session, user, None, "preferences.updated", None, {"version": current + 1}
            )
            result = PreferencesRead(data=body.data, version=current + 1)
        return result

    async def setup(self, user):
        profile, preferences = await self.profile(user), await self.read(user)
        async with self.database.transaction(user) as session:
            favorites = await verified_favorites(session, preferences.data)
        return SetupRead(profile=profile, preferences=preferences, favorites=favorites)

    async def save_setup(self, user, body):
        async with self.database.transaction(user) as session:
            for scope in ("preferences", "profile"):
                await session.execute(
                    text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                    {"key": scope + ":" + str(user)},
                )
            profile = (
                (
                    await session.execute(
                        text(
                            "SELECT display_name,version FROM personal.profiles WHERE user_id=:user FOR UPDATE"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one_or_none()
            )
            preferences = (
                (
                    await session.execute(
                        text(
                            "SELECT payload,version FROM personal.user_preferences WHERE user_id=:user FOR UPDATE"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one_or_none()
            )
            profile_version, preferences_version = (
                (profile["version"] if profile else 0),
                (preferences["version"] if preferences else 0),
            )
            if (
                profile_version != body.expected_profile_version
                or preferences_version != body.expected_preferences_version
            ):
                raise AppError(409, "CONFLICT", "Review the latest profile before saving setup.")
            if preferences and "discovery_mode" not in body.data.model_fields_set:
                body.data = body.data.model_copy(
                    update={
                        "discovery_mode": Preferences.model_validate(preferences["payload"]).discovery_mode
                    }
                )
            submitted_favorites = await verified_favorites(session, body.data, effective=False)
            body.data = await favorite_state.prepare_preferences(
                session, user, PreferencesRead(
                    data=Preferences.model_validate(preferences["payload"]) if preferences else Preferences(),
                    version=preferences_version,
                ), body.data,
            )
            selected = set(body.data.intelligence_profile.favorite_anime_ids)
            favorites = [media for media in submitted_favorites if media.id in selected]
            name = body.display_name.strip()
            if (
                profile
                and preferences
                and profile["display_name"] == name
                and Preferences.model_validate(preferences["payload"]) == body.data
            ):
                return SetupRead(
                    profile=ProfileRead(display_name=name, version=profile_version),
                    preferences=PreferencesRead(data=body.data, version=preferences_version),
                    favorites=favorites,
                )
            await session.execute(
                text(
                    "INSERT INTO personal.profiles(user_id,display_name,version) VALUES(:user,:name,1) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,version=personal.profiles.version+1"
                ),
                {"user": user, "name": name},
            )
            await session.execute(
                text(
                    "INSERT INTO personal.user_preferences(user_id,payload,version) VALUES(:user,CAST(:payload AS jsonb),1) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,version=personal.user_preferences.version+1"
                ),
                {"user": user, "payload": body.data.model_dump_json()},
            )
            await library.record_activity(
                session,
                user,
                None,
                "profile.setup",
                None,
                {
                    "profile_version": profile_version + 1,
                    "preferences_version": preferences_version + 1,
                },
            )
            return SetupRead(
                profile=ProfileRead(display_name=name, version=profile_version + 1),
                preferences=PreferencesRead(data=body.data, version=preferences_version + 1),
                favorites=favorites,
            )

    async def profile(self, user):
        async with self.database.transaction(user) as session:
            row = (
                (
                    await session.execute(
                        text(
                            "SELECT display_name,version FROM personal.profiles WHERE user_id=:user"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .one_or_none()
            )
            return ProfileRead(
                display_name=row["display_name"] if row else "",
                version=row["version"] if row else 0,
            )

    async def update_profile(self, user, body):
        async with self.database.transaction(user) as session:
            await session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": "profile:" + str(user)},
            )
            row = (
                (
                    await session.execute(
                        text("SELECT * FROM personal.profiles WHERE user_id=:user FOR UPDATE"),
                        {"user": user},
                    )
                )
                .mappings()
                .one_or_none()
            )
            current = row["version"] if row else 0
            if current != body.expected_version:
                raise AppError(409, "CONFLICT", "Review the latest profile.")
            name = body.display_name.strip()
            await session.execute(
                text(
                    "INSERT INTO personal.profiles(user_id,display_name) VALUES(:user,:name) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,version=personal.profiles.version+1"
                ),
                {"user": user, "name": name},
            )
            await library.record_activity(
                session, user, None, "profile.updated", None, {"version": current + 1}
            )
            result = ProfileRead(display_name=name, version=current + 1)
        return result

    async def favorite_page(self, user, limit=24, cursor=None, ids=None):
        last = None
        if cursor:
            try:
                last = UUID(base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4)).decode())
            except (ValueError, UnicodeDecodeError, binascii.Error) as exc:
                raise AppError(422, "INVALID_CURSOR", "Reset the favourite page.") from exc
        async with self.database.transaction(user) as session:
            current = await favorite_state.read_state(session, user)
            effective = await favorite_state.effective_ids(session, user, current.data)
            if ids is not None:
                effective &= set(ids)
            ordered = sorted(effective)
            selected = [media_id for media_id in ordered if last is None or media_id > last]
            page = selected[:limit]
            media = {item.id: item for item in await library.stored_media_batch(session, page)}
            if set(media) != set(page):
                raise AppError(409, "IDENTITY_CONFLICT", "A favourite identity needs review.")
            next_cursor = base64.urlsafe_b64encode(str(page[-1]).encode()).decode().rstrip("=") if len(selected) > limit else None
            return FavoritesPage(data=[media[media_id] for media_id in page], total=len(ordered),
                                 preferences_version=current.version, next_cursor=next_cursor)

    async def set_favorite(self, user, media_id, body):
        async with self.database.transaction(user) as session:
            await favorite_state.lock_state(session, user)
            return await favorite_state.set_choice(session, user, media_id, body.favorite,
                                                   body.expected_preferences_version)
