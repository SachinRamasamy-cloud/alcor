from sqlalchemy import text

from app.core.errors import AppError
from app.modules.library import public as library
from app.modules.preferences.schemas import Preferences, PreferencesRead, ProfileRead


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
