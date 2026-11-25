import json
from uuid import uuid4

from sqlalchemy import text

from app.core.errors import AppError
from app.integrations.metadata.schemas import Media
from app.modules.catalogue.service import eligible_items, select_page
from app.modules.discovery.schemas import FilterRead, PersonalPage
from app.modules.preferences.schemas import Preferences


class DiscoveryService:
    def __init__(self, database, provider):
        self.database, self.provider = database, provider

    async def exclusions(self, user, body):
        candidates = [
            dict(
                anilist_id=str(c.anilist_id),
                mal_id=str(c.mal_id) if c.mal_id else None,
                media_type=c.media_type,
            )
            for c in body.candidates
        ]
        async with self.database.transaction(user) as session:
            pref = await session.scalar(
                text("SELECT payload FROM personal.user_preferences WHERE user_id=:user"),
                {"user": user},
            )
            planned = (
                Preferences.model_validate(pref).include_planned
                if pref
                else Preferences().include_planned
            )
            rows = (
                (
                    await session.execute(
                        text("""
              SELECT i.anilist_id,e.status,e.ever_completed,e.deleted_at
              FROM jsonb_to_recordset(CAST(:candidates AS jsonb)) AS i(anilist_id text,mal_id text,media_type text)
              JOIN catalogue.media m ON m.media_type=i.media_type AND (
                m.external_id='anilist:'||i.anilist_id OR m.external_id=i.mal_id OR m.id IN (
                  SELECT s.media_id FROM catalogue.source_ids s WHERE s.media_type=i.media_type AND
                  ((s.namespace='anilist' AND s.external_id=i.anilist_id) OR (s.namespace='mal' AND s.external_id=i.mal_id))))
              JOIN personal.library_entries e ON e.media_id=m.id AND e.user_id=:user
            """),
                        {"candidates": json.dumps(candidates), "user": user},
                    )
                )
                .mappings()
                .all()
            )
            return sorted(
                {
                    int(r["anilist_id"])
                    for r in rows
                    if r["ever_completed"]
                    or (
                        body.mode == "new_to_me"
                        and (
                            r["status"]
                            in {"in_progress", "completed", "on_hold", "dropped", "not_interested"}
                            or (
                                not planned and r["status"] == "planned" and r["deleted_at"] is None
                            )
                        )
                    )
                }
            )

    async def discover(self, user, query):
        items = [] if query.memory else await self.provider.catalogue()
        async with self.database.transaction(user) as session:
            if query.memory:
                payloads = (
                    (
                        await session.execute(
                            text(
                                "SELECT m.payload FROM catalogue.media m JOIN personal.library_entries e ON e.media_id=m.id WHERE e.user_id=:user AND e.deleted_at IS NULL"
                            ),
                            {"user": user},
                        )
                    )
                    .scalars()
                    .all()
                )
                items = [Media.model_validate(payload) for payload in payloads]
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT media_id,status,ever_completed,favorite,version,notes,deleted_at FROM personal.library_entries WHERE user_id=:user"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .all()
            )
            pref = await session.scalar(
                text("SELECT payload FROM personal.user_preferences WHERE user_id=:user"),
                {"user": user},
            )
            preferences = Preferences.model_validate(pref) if pref else Preferences()
            planned = (
                query.include_planned
                if query.include_planned is not None
                else preferences.include_planned
            )
            excluded = set()
            if query.mode == "hide_watched":
                excluded = {r["media_id"] for r in rows if r["ever_completed"]}
            elif query.mode == "new_to_me":
                excluded = {
                    r["media_id"]
                    for r in rows
                    if r["ever_completed"]
                    or r["status"]
                    in {"in_progress", "completed", "on_hold", "dropped", "not_interested"}
                    or (not planned and r["status"] == "planned" and r["deleted_at"] is None)
                }
            search_context = query.q if query.memory else ""
            if query.memory and query.q:
                # Search private notes only inside this private, no-store response.
                note_ids = {
                    r["media_id"]
                    for r in rows
                    if query.q.casefold() in (r["notes"] or "").casefold()
                }
                text_matches = eligible_items(items, query, query.media_type)
                matched = {m.id for m in text_matches} | note_ids
                items = [m for m in items if m.id in matched]
                query = query.model_copy(update={"q": ""})
            page = select_page(items, query, query.media_type, excluded, context=search_context)
            ids = {m.id for m in page.data}
            overlay = {
                str(r["media_id"]): {
                    "status": r["status"],
                    "ever_completed": r["ever_completed"],
                    "favorite": r["favorite"],
                    "version": r["version"],
                }
                for r in rows
                if r["media_id"] in ids and r["deleted_at"] is None
            }
            return PersonalPage(
                **{**page.model_dump(), "source": "Saved library" if query.memory else page.source},
                personal_status=overlay,
            )

    async def filters(self, user):
        async with self.database.transaction(user) as session:
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT * FROM personal.saved_filters WHERE user_id=:user ORDER BY id LIMIT 100"
                        ),
                        {"user": user},
                    )
                )
                .mappings()
                .all()
            )
            return [
                FilterRead(id=r["id"], name=r["name"], query=r["payload"], version=r["version"])
                for r in rows
            ]

    async def save_filter(self, user, body, filter_id=None):
        if not body.name.strip():
            raise AppError(422, "INVALID_REQUEST", "Enter a filter name.")
        query = body.query.model_copy(update={"cursor": None})
        async with self.database.transaction(user) as session:
            if filter_id is None:
                filter_id = uuid4()
                await session.execute(
                    text(
                        "INSERT INTO personal.saved_filters(id,user_id,name,payload,request_id) VALUES(:id,:user,:name,CAST(:payload AS jsonb),:request) ON CONFLICT(user_id,request_id) DO NOTHING"
                    ),
                    {
                        "id": filter_id,
                        "user": user,
                        "name": body.name.strip(),
                        "payload": query.model_dump_json(),
                        "request": body.request_id,
                    },
                )
                filter_id = await session.scalar(
                    text(
                        "SELECT id FROM personal.saved_filters WHERE user_id=:user AND request_id=:request"
                    ),
                    {"user": user, "request": body.request_id},
                )
            else:
                row = (
                    (
                        await session.execute(
                            text(
                                "SELECT * FROM personal.saved_filters WHERE user_id=:user AND id=:id FOR UPDATE"
                            ),
                            {"user": user, "id": filter_id},
                        )
                    )
                    .mappings()
                    .one_or_none()
                )
                if row is None:
                    raise AppError(404, "NOT_FOUND", "This filter is not available.")
                if row["version"] != body.expected_version:
                    raise AppError(409, "CONFLICT", "Review the latest filter.")
                await session.execute(
                    text(
                        "UPDATE personal.saved_filters SET name=:name,payload=CAST(:payload AS jsonb),version=version+1 WHERE user_id=:user AND id=:id"
                    ),
                    {
                        "name": body.name.strip(),
                        "payload": query.model_dump_json(),
                        "user": user,
                        "id": filter_id,
                    },
                )
            row = (
                (
                    await session.execute(
                        text("SELECT * FROM personal.saved_filters WHERE user_id=:user AND id=:id"),
                        {"user": user, "id": filter_id},
                    )
                )
                .mappings()
                .one()
            )
            return FilterRead(
                id=row["id"], name=row["name"], query=row["payload"], version=row["version"]
            )

    async def delete_filter(self, user, filter_id, version):
        async with self.database.transaction(user) as session:
            row = (
                await session.execute(
                    text(
                        "SELECT version FROM personal.saved_filters WHERE user_id=:user AND id=:id FOR UPDATE"
                    ),
                    {"user": user, "id": filter_id},
                )
            ).one_or_none()
            if row is None:
                raise AppError(404, "NOT_FOUND", "This filter is not available.")
            if row.version != version:
                raise AppError(409, "CONFLICT", "Review the latest filter.")
            await session.execute(
                text("DELETE FROM personal.saved_filters WHERE user_id=:user AND id=:id"),
                {"user": user, "id": filter_id},
            )
        return {"deleted": True}
