from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.core.auth import current_user
from app.core.errors import AppError
from app.modules.tracking.schemas import (
    ManualTargets,
    ProgressWrite,
    SessionRead,
    SessionVersion,
    StartSession,
)

router = APIRouter(prefix="/api/v1/me", tags=["tracking"])
User = Annotated[UUID, Depends(current_user)]


def install_routes(name: str, media_type: str, unit: str):
    async def continue_queue(request: Request, user: User) -> list[dict]:
        return await request.app.state.tracking.continue_queue(user, media_type)

    router.add_api_route(
        "/continue-watching" if media_type == "anime" else "/continue-reading",
        continue_queue,
        methods=["GET"],
        name=f"continue_{media_type}",
    )

    async def start(request: Request, user: User, body: StartSession) -> SessionRead:
        return await request.app.state.tracking.start(user, body, media_type)

    async def sessions(request: Request, user: User, media_id: UUID | None = None) -> list[dict]:
        return await request.app.state.tracking.list(user, media_id, media_type)

    async def read(
        request: Request, user: User, session_id: UUID, offset: int = Query(0, ge=0, le=2000)
    ) -> SessionRead:
        value = await request.app.state.tracking.read(user, session_id, offset)
        if value.media.media_type != media_type:
            raise AppError(404, "NOT_FOUND", "This session is not available.")
        return value

    async def bulk(
        request: Request, user: User, session_id: UUID, body: ProgressWrite
    ) -> SessionRead:
        await read(request, user, session_id, 0)
        return await request.app.state.tracking.update(user, session_id, body)

    async def complete(
        request: Request, user: User, session_id: UUID, body: SessionVersion
    ) -> SessionRead:
        await read(request, user, session_id, 0)
        return await request.app.state.tracking.update(user, session_id, body, complete=True)

    async def manual(
        request: Request, user: User, media_id: UUID, body: ManualTargets
    ) -> SessionRead:
        if body.media_id != media_id:
            raise AppError(422, "INVALID_REQUEST", "Use the matching title.")
        await read(request, user, body.session_id, 0)
        return await request.app.state.tracking.add_manual(user, body)

    router.add_api_route(
        f"/media/{{media_id}}/manual-{unit}", manual, methods=["POST"], name=f"manual_{unit}"
    )

    router.add_api_route(f"/{name}", start, methods=["POST"], name=f"start_{name}")
    router.add_api_route(f"/{name}", sessions, methods=["GET"], name=f"list_{name}")
    router.add_api_route(
        f"/{name}/{{session_id}}/{unit}", read, methods=["GET"], name=f"read_{name}"
    )
    router.add_api_route(
        f"/{name}/{{session_id}}/{unit}/bulk", bulk, methods=["POST"], name=f"update_{name}"
    )
    router.add_api_route(
        f"/{name}/{{session_id}}/complete", complete, methods=["POST"], name=f"complete_{name}"
    )


install_routes("watch-sessions", "anime", "episodes")
install_routes("reading-sessions", "manga", "chapters")
