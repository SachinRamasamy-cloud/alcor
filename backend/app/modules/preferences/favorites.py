"""One account-owned favourite truth, reconciled without consumption records."""
from sqlalchemy import text

from app.core.errors import AppError
from app.modules.library import public as library
from app.modules.preferences.schemas import FavoriteMutation, Preferences, PreferencesRead


async def lock_state(session, user):
    await session.execute(text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                          {"key": "preferences:" + str(user)})


async def read_state(session, user):
    row = (await session.execute(text(
        "SELECT payload,version FROM personal.user_preferences WHERE user_id=:user"
    ), {"user": user})).mappings().one_or_none()
    return PreferencesRead(data=Preferences.model_validate(row["payload"]) if row else Preferences(),
                           version=row["version"] if row else 0)


def setup_ids(data):
    return set(data.intelligence_profile.favorite_anime_ids if data.intelligence_profile else [])


async def effective_ids(session, user, data):
    if data.favorite_media_ids is not None:
        return set(data.favorite_media_ids)
    return setup_ids(data) | await library.favorite_ids(session, user)


async def validate_ids(session, ids):
    if len(ids) > 1000:
        raise AppError(422, "FAVORITE_LIMIT", "Review the favourite list limit.")
    if await library.verified_ids(session, ids) != set(ids):
        raise AppError(422, "INVALID_REQUEST", "Choose verified favourites.")


async def prepare_preferences(session, user, current, incoming):
    fields = incoming.model_fields_set
    if "favorite_media_ids" not in fields:
        incoming = incoming.model_copy(update={"favorite_media_ids": current.data.favorite_media_ids})
    elif incoming.favorite_media_ids is None and current.data.favorite_media_ids is not None:
        raise AppError(422, "INVALID_REQUEST", "The reconciled favourite list cannot be reset.")
    previous = await effective_ids(session, user, current.data)
    before, after = setup_ids(current.data), setup_ids(incoming)
    added, removed = after - before, before - after
    explicit = incoming.favorite_media_ids is not None and incoming.favorite_media_ids != current.data.favorite_media_ids
    desired = set(incoming.favorite_media_ids) if explicit else (previous | added) - removed
    if explicit and (not added <= desired or removed & desired):
        raise AppError(422, "INVALID_REQUEST", "Submit one consistent favourite choice.")
    canonical = current.data.favorite_media_ids is not None or explicit or desired != previous
    if not canonical:
        return incoming
    await validate_ids(session, desired)
    profile = incoming.intelligence_profile
    if profile:
        profile = profile.model_copy(update={"favorite_anime_ids": [i for i in profile.favorite_anime_ids if i in desired]})
    incoming = incoming.model_copy(update={"favorite_media_ids": sorted(desired), "intelligence_profile": profile})
    if desired != previous or current.data.favorite_media_ids is None:
        await library.sync_favorite_flags(session, user, previous, desired, current.version + 1, before,
                                         force=previous | desired if current.data.favorite_media_ids is None else ())
    return incoming


async def set_choice(session, user, media_id, favorite, expected_version=None, skip_library=(), record=True,
                     restore_setup=False):
    # Every caller holds the preference lock before locking library rows.
    current = await read_state(session, user)
    if await library.verified_ids(session, [media_id]) != {media_id}:
        raise AppError(404, "NOT_FOUND", "This title is not available.")
    previous = await effective_ids(session, user, current.data)
    if (media_id in previous) == favorite:
        return FavoriteMutation(media_id=media_id, favorite=favorite,
                                preferences_version=current.version, changed=False,
                                preferences=current, entry=await library.owned_entry(session, user, media_id))
    if expected_version is not None and expected_version != current.version:
        raise AppError(409, "CONFLICT", "Review the latest favourites.")
    desired = previous | {media_id} if favorite else previous - {media_id}
    await validate_ids(session, desired)
    profile, before_setup = current.data.intelligence_profile, setup_ids(current.data)
    if profile:
        selected = [i for i in profile.favorite_anime_ids if i in desired]
        if restore_setup and media_id not in selected:
            if len(selected) >= 10:
                raise AppError(409, "CONFLICT", "Review the latest setup choices.")
            selected.append(media_id)
        profile = profile.model_copy(update={"favorite_anime_ids": selected})
    data = current.data.model_copy(update={"favorite_media_ids": sorted(desired), "intelligence_profile": profile})
    await session.execute(text("""
        INSERT INTO personal.user_preferences(user_id,payload,version) VALUES(:user,CAST(:payload AS jsonb),1)
        ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,version=personal.user_preferences.version+1
    """), {"user": user, "payload": data.model_dump_json()})
    version = current.version + 1
    await library.sync_favorite_flags(session, user, previous, desired, version, before_setup, skip_library,
                                     force=previous | desired if current.data.favorite_media_ids is None else ())
    if record:
        await library.record_activity(session, user, None, "preferences.updated", None,
                                      {"version": version, "favorites_changed": True})
    return FavoriteMutation(media_id=media_id, favorite=favorite, preferences_version=version, changed=True,
                            preferences=PreferencesRead(data=data, version=version),
                            entry=await library.owned_entry(session, user, media_id))
