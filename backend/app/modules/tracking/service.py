from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import text

from app.core.errors import AppError
from app.integrations.metadata.schemas import Media
from app.modules.library import public as library
from app.modules.tracking import repository as repo
from app.modules.tracking.policy import summarize
from app.modules.tracking.schemas import SessionRead


class TrackingService:
    def __init__(self, database, provider):
        self.database, self.provider = database, provider

    async def unit_details(self, user, session_id, key, body):
        values = body.model_dump(exclude_unset=True, exclude={"expected_version"})
        async with self.database.transaction(user) as session:
            row = await repo.session_row(session, user, session_id, lock=True)
            if row is None:
                raise AppError(404, "NOT_FOUND", "This session is not available.")
            unit = next(
                (u for u in await repo.targets(session, user, session_id) if u["key"] == key), None
            )
            if unit is None:
                raise AppError(404, "NOT_FOUND", "This target is not available.")
            changed = any(unit[k] != v for k, v in values.items())
            if changed:
                if row["version"] != body.expected_version:
                    raise AppError(409, "CONFLICT", "Review the latest session state.")
                assignments = ",".join(f"{k}=:{k}" for k in values if k in {"rating", "notes"})
                await session.execute(
                    text(
                        f"UPDATE personal.tracking_units SET {assignments} WHERE user_id=:user AND session_id=:id AND key=:key"
                    ),
                    {**values, "user": user, "id": session_id, "key": key},
                )
                await session.execute(
                    text(
                        "UPDATE personal.tracking_sessions SET version=version+1,updated_at=now() WHERE user_id=:user AND id=:id"
                    ),
                    {"user": user, "id": session_id},
                )
                await library.record_activity(
                    session,
                    user,
                    row["media_id"],
                    "tracking.unit_details",
                    {"session_id": str(session_id), "key": key, "version": row["version"]},
                    {"session_id": str(session_id), "key": key, "fields": sorted(values)},
                )
            result = await self.read_in_transaction(
                session, user, await repo.session_row(session, user, session_id)
            )
        return result

    async def continue_queue(self, user, media_type):
        async with self.database.transaction(user) as session:
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT s.*,m.payload FROM personal.tracking_sessions s JOIN catalogue.media m ON m.id=s.media_id JOIN personal.library_entries e ON (e.user_id,e.media_id)=(s.user_id,s.media_id) WHERE s.user_id=:user AND s.active AND m.media_type=:type AND e.status='in_progress' AND e.deleted_at IS NULL ORDER BY s.updated_at DESC,s.id LIMIT 24"
                        ),
                        {"user": user, "type": media_type},
                    )
                )
                .mappings()
                .all()
            )
            if not rows:
                return []
            ids = [r["id"] for r in rows]
            units = (
                (
                    await session.execute(
                        text(
                            "SELECT u.session_id,u.key,u.sort_order AS \"order\",u.released,COALESCE(p.state,'unresolved') AS state FROM personal.tracking_units u LEFT JOIN personal.unit_progress p ON (p.user_id,p.session_id,p.unit_key)=(u.user_id,u.session_id,u.key) WHERE u.user_id=:user AND u.session_id=ANY(CAST(:ids AS uuid[]))"
                        ),
                        {"user": user, "ids": ids},
                    )
                )
                .mappings()
                .all()
            )
            grouped = {i: [] for i in ids}
            for unit in units:
                grouped[unit["session_id"]].append(dict(unit))
            result = []
            for row in rows:
                targets = grouped[row["id"]]
                summary = summarize(
                    targets,
                    {u["key"]: u["state"] for u in targets},
                    final_total=row["final_total"],
                    coverage=row["coverage_complete"],
                    skip_counts=row["skip_counts"],
                )
                if summary.next_key is not None or summary.caught_up:
                    result.append(
                        {
                            "session_id": str(row["id"]),
                            "version": row["version"],
                            "media": row["payload"],
                            "summary": summary.model_dump(),
                        }
                    )
            return result

    async def add_manual(self, user, body):
        async with self.database.transaction(user) as session:
            row = await repo.session_row(session, user, body.session_id, lock=True)
            if row is None or row["media_id"] != body.media_id:
                raise AppError(404, "NOT_FOUND", "This session is not available.")
            if not row["active"] or row["version"] != body.expected_version:
                raise AppError(409, "CONFLICT", "Review the latest session state.")
            units = await repo.targets(session, user, row["id"])
            existing = {u["key"] for u in units}
            labels = [label for label in body.manual_labels if label not in existing]
            if len(units) + len(labels) > 2000:
                raise AppError(422, "INVALID_REQUEST", "Use a bounded set of targets.")
            order = max((u["order"] for u in units), default=0)
            for i, label in enumerate(labels):
                await repo.insert_target(
                    session,
                    user,
                    row["id"],
                    body.media_id,
                    {
                        "key": label,
                        "label": label,
                        "order": order + i + 1,
                        "released": True,
                        "title": None,
                        "released_at": None,
                        "provenance": "manual",
                    },
                )
            if labels:
                await session.execute(
                    text(
                        "UPDATE personal.tracking_sessions SET version=version+1,coverage_complete=false,final_total=NULL,updated_at=now() WHERE user_id=:user AND id=:id"
                    ),
                    {"user": user, "id": row["id"]},
                )
                await library.record_activity(
                    session,
                    user,
                    body.media_id,
                    "tracking.targets_added",
                    None,
                    {"session_id": str(row["id"]), "keys": labels},
                )
            result = await self.read_in_transaction(
                session, user, await repo.session_row(session, user, row["id"])
            )
        return result

    async def read_in_transaction(self, session, user, row, offset=0):
        units = await repo.targets(session, user, row["id"])
        summary = summarize(
            units,
            {u["key"]: u["state"] for u in units},
            final_total=row["final_total"],
            coverage=row["coverage_complete"],
            skip_counts=row["skip_counts"],
        )
        return SessionRead(
            id=row["id"],
            media=Media.model_validate(row["payload"]),
            kind=row["kind"],
            active=row["active"],
            version=row["version"],
            skip_counts=row["skip_counts"],
            coverage_complete=row["coverage_complete"],
            final_total=row["final_total"],
            summary=summary,
            units=units[offset : offset + 100],
            next_offset=offset + 100 if len(units) > offset + 100 else None,
            updated_at=row["updated_at"],
        )

    async def read(self, user, session_id, offset=0):
        async with self.database.transaction(user) as session:
            row = await repo.session_row(session, user, session_id)
            if row is None:
                raise AppError(404, "NOT_FOUND", "This session is not available.")
            return await self.read_in_transaction(session, user, row, offset)

    async def list(self, user, media_id=None, media_type="anime"):
        async with self.database.transaction(user) as session:
            rows = (
                (
                    await session.execute(
                        text(
                            "SELECT s.*,m.payload FROM personal.tracking_sessions s JOIN catalogue.media m ON m.id=s.media_id WHERE s.user_id=:user AND m.media_type=:type AND (CAST(:media AS uuid) IS NULL OR s.media_id=:media) ORDER BY s.updated_at DESC,s.id LIMIT 100"
                        ),
                        {"user": user, "media": media_id, "type": media_type},
                    )
                )
                .mappings()
                .all()
            )
            # Bounded title/session listing; full unit pages are only requested on selection.
            return [
                {
                    "id": str(r["id"]),
                    "media_id": str(r["media_id"]),
                    "kind": r["kind"],
                    "active": r["active"],
                    "version": r["version"],
                    "updated_at": r["updated_at"].isoformat(),
                }
                for r in rows
            ]

    async def start(self, user, body, media_type=None):
        media = await library.prepare_media(self.database, self.provider, user, body.media_id)
        if media_type and media.media_type != media_type:
            raise AppError(422, "INVALID_REQUEST", "Use the matching media type.")
        units, coverage, final = [], False, None
        if body.manual_labels:
            units = [
                {
                    "key": label,
                    "label": label,
                    "order": i + 1,
                    "released": True,
                    "title": None,
                    "released_at": None,
                    "provenance": "manual",
                }
                for i, label in enumerate(body.manual_labels)
            ]
        elif media.media_type == "anime":
            episodes = await self.provider.episodes(media.id)
            coverage, final = episodes.coverage_complete, episodes.confirmed_final_total
            units = [
                {
                    "key": e.key,
                    "label": e.label,
                    "order": e.order,
                    "released": e.released_at is not None and e.released_at <= datetime.now(UTC),
                    "title": e.title,
                    "released_at": e.released_at,
                    "provenance": "provider",
                }
                for e in episodes.data
            ]
        if len(units) > 2000:
            raise AppError(422, "INVALID_REQUEST", "Use a bounded set of tracking targets.")
        async with self.database.transaction(user) as session:
            replay = await session.scalar(
                text(
                    "SELECT id FROM personal.tracking_sessions WHERE user_id=:user AND request_id=:request"
                ),
                {"user": user, "request": body.request_id},
            )
            if replay:
                row = await repo.session_row(session, user, replay)
                if row["media_id"] != media.id:
                    raise AppError(409, "CONFLICT", "This request was used for another title.")
                result = await self.read_in_transaction(session, user, row)
            else:
                await library.lock_for_tracking(session, user, media, body.repeat)
                active = await session.scalar(
                    text(
                        "SELECT id FROM personal.tracking_sessions WHERE user_id=:user AND media_id=:media AND active"
                    ),
                    {"user": user, "media": media.id},
                )
                if active:
                    raise AppError(409, "CONFLICT", "An active session already exists.")
                session_id = uuid4()
                await session.execute(
                    text(
                        "INSERT INTO personal.tracking_sessions(id,user_id,media_id,request_id,kind,skip_counts,coverage_complete,final_total) VALUES (:id,:user,:media,:request,:kind,:skip,:coverage,:final)"
                    ),
                    {
                        "id": session_id,
                        "user": user,
                        "media": media.id,
                        "request": body.request_id,
                        "kind": "repeat" if body.repeat else "initial",
                        "skip": body.skip_counts,
                        "coverage": coverage,
                        "final": final,
                    },
                )
                for unit in units:
                    await repo.insert_target(session, user, session_id, media.id, unit)
                await library.set_tracking_status(session, user, media.id, False)
                await library.record_activity(
                    session,
                    user,
                    media.id,
                    "tracking.started",
                    None,
                    {"session_id": str(session_id), "kind": "repeat" if body.repeat else "initial"},
                )
                result = await self.read_in_transaction(
                    session, user, await repo.session_row(session, user, session_id)
                )
        return result

    async def update(self, user, session_id, body, complete=False):
        async with self.database.transaction(user) as session:
            row = await repo.session_row(session, user, session_id)
            if row is None:
                raise AppError(404, "NOT_FOUND", "This session is not available.")
            await library.lock_for_tracking(
                session, user, Media.model_validate(row["payload"]), row["kind"] == "repeat"
            )
            row = await repo.session_row(session, user, session_id, lock=True)
            if row["version"] != body.expected_version or not row["active"]:
                raise AppError(409, "CONFLICT", "Review the latest session state.")
            units = await repo.targets(session, user, session_id)
            changes = []
            if not complete:
                expected = "watched" if row["payload"]["media_type"] == "anime" else "read"
                if body.state not in {expected, "skipped", "unresolved"}:
                    raise AppError(422, "INVALID_REQUEST", "Use the matching progress type.")
                indexed = {u["key"]: u for u in units}
                for key in body.keys:
                    unit = indexed.get(key)
                    if unit is None or not unit["released"]:
                        raise AppError(
                            422, "INVALID_REQUEST", "Select available targets from this session."
                        )
                    if unit["state"] != body.state:
                        changes.append({"key": key, "before": unit["state"], "after": body.state})
                        await repo.set_mark(
                            session, user, session_id, row["media_id"], key, body.state
                        )
                        unit["state"] = body.state
            summary = summarize(
                units,
                {u["key"]: u["state"] for u in units},
                final_total=row["final_total"],
                coverage=row["coverage_complete"],
                skip_counts=row["skip_counts"],
            )
            finished = complete or summary.completed
            if changes or complete:
                await session.execute(
                    text(
                        "UPDATE personal.tracking_sessions SET version=version+1,updated_at=now(),active=:active,ended_at=CASE WHEN :finished THEN now() ELSE NULL END WHERE user_id=:user AND id=:id"
                    ),
                    {"active": not finished, "finished": finished, "user": user, "id": session_id},
                )
                if finished:
                    await library.set_tracking_status(session, user, row["media_id"], True)
                await library.record_activity(
                    session,
                    user,
                    row["media_id"],
                    "tracking.completed_assertion" if complete else "tracking.progress",
                    {"session_id": str(session_id), "version": row["version"]},
                    {"session_id": str(session_id), "changes": changes, "completed": finished},
                )
            result = await self.read_in_transaction(
                session, user, await repo.session_row(session, user, session_id)
            )
        return result
