from sqlalchemy import text


async def session_row(session, user, session_id, lock=False):
    return (
        (
            await session.execute(
                text(
                    "SELECT s.*,m.payload FROM personal.tracking_sessions s JOIN catalogue.media m ON m.id=s.media_id WHERE s.user_id=:user AND s.id=:id"
                    + (" FOR UPDATE OF s" if lock else "")
                ),
                {"user": user, "id": session_id},
            )
        )
        .mappings()
        .one_or_none()
    )


async def targets(session, user, session_id):
    rows = (
        (
            await session.execute(
                text(
                    "SELECT u.key,u.label,u.sort_order AS \"order\",u.released,u.title,u.released_at,u.provenance,u.rating,u.notes,COALESCE(p.state,'unresolved') AS state FROM personal.tracking_units u LEFT JOIN personal.unit_progress p ON (p.user_id,p.session_id,p.unit_key)=(u.user_id,u.session_id,u.key) WHERE u.user_id=:user AND u.session_id=:id ORDER BY u.sort_order,u.key"
                ),
                {"user": user, "id": session_id},
            )
        )
        .mappings()
        .all()
    )
    return [dict(row) for row in rows]


async def insert_target(session, user, session_id, media_id, unit):
    await session.execute(
        text(
            "INSERT INTO personal.tracking_units(user_id,session_id,media_id,key,label,sort_order,released,title,released_at,provenance) VALUES (:user,:session,:media,:key,:label,:order,:released,:title,:released_at,:provenance)"
        ),
        {"user": user, "session": session_id, "media": media_id, **unit},
    )


async def set_mark(session, user, session_id, media_id, key, state):
    params = {"user": user, "session": session_id, "media": media_id, "key": key, "state": state}
    if state == "unresolved":
        await session.execute(
            text(
                "DELETE FROM personal.unit_progress WHERE user_id=:user AND session_id=:session AND unit_key=:key"
            ),
            params,
        )
    else:
        await session.execute(
            text(
                "INSERT INTO personal.unit_progress(user_id,session_id,media_id,unit_key,state) VALUES (:user,:session,:media,:key,:state) ON CONFLICT(user_id,session_id,unit_key) DO UPDATE SET state=excluded.state,recorded_at=now()"
            ),
            params,
        )
