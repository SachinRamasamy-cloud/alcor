from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.core.auth import current_user
from app.modules.reporting.schemas import HistoryPage, StatisticsRead, UndoRequest

router = APIRouter(prefix="/api/v1/me", tags=["reporting"])
User = Annotated[UUID, Depends(current_user)]


@router.get("/history", response_model=HistoryPage)
async def history(
    request: Request,
    user: User,
    limit: int = Query(24, ge=1, le=100),
    cursor: str | None = Query(None, max_length=512),
    media_id: UUID | None = None,
    page: int | None = Query(None, ge=1, le=10000),
):
    return await request.app.state.reporting.history(user, limit, cursor, media_id, page)


@router.get("/statistics", response_model=StatisticsRead)
async def statistics(request: Request, user: User):
    return await request.app.state.reporting.statistics(user)


@router.post("/actions/{activity_id}/undo")
async def undo(request: Request, user: User, activity_id: UUID, body: UndoRequest):
    return await request.app.state.reporting.undo(user, activity_id, body.expected_version)
