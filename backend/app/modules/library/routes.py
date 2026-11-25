from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from pydantic import PositiveInt

from app.core.auth import current_user
from app.modules.library.schemas import (
    LibraryDetails,
    LibraryEntry,
    LibraryMutation,
    LibraryPage,
    LibrarySort,
    LibraryStatus,
    LibraryWrite,
    WishlistWrite,
)

router = APIRouter(prefix="/api/v1/me", tags=["library"])
User = Annotated[UUID, Depends(current_user)]


@router.delete("/library/{media_id}", response_model=LibraryMutation)
async def remove_library(
    request: Request, user: User, media_id: UUID, expected_version: int = Query(ge=1)
):
    return await request.app.state.library.remove_library(user, media_id, expected_version)


@router.get("/media-status", response_model=list[LibraryEntry])
async def overlay(
    request: Request,
    user: User,
    ids: Annotated[list[UUID] | None, Query(max_length=100)] = None,
    anilist_ids: Annotated[list[PositiveInt] | None, Query(max_length=100)] = None,
):
    from app.core.errors import AppError

    if not (ids or anilist_ids) or len(ids or []) + len(anilist_ids or []) > 100:
        raise AppError(422, "INVALID_REQUEST", "Choose between 1 and 100 titles.")
    return await request.app.state.library.overlay(user, ids or [], anilist_ids or [])


@router.patch("/library/{media_id}", response_model=LibraryMutation)
async def details(request: Request, user: User, media_id: UUID, body: LibraryDetails):
    return await request.app.state.library.details(user, media_id, body)


@router.get("/library", response_model=LibraryPage)
async def library(
    request: Request,
    user: User,
    status: LibraryStatus | None = None,
    limit: int = Query(24, ge=1, le=100),
    cursor: str | None = Query(None, max_length=512),
    page: int | None = Query(None, ge=1, le=10000),
    q: str = Query("", max_length=200),
    media_type: str | None = Query(None, pattern="^(anime|manga)$"),
    sort: LibrarySort = "id",
):
    return await request.app.state.library.list_entries(
        user, status, limit, cursor, page, q=q, media_type=media_type, sort=sort
    )


@router.get("/wishlist", response_model=LibraryPage)
async def wishlist(
    request: Request,
    user: User,
    limit: int = Query(24, ge=1, le=100),
    cursor: str | None = Query(None, max_length=512),
    page: int | None = Query(None, ge=1, le=10000),
    q: str = Query("", max_length=200),
    media_type: str | None = Query(None, pattern="^(anime|manga)$"),
    sort: LibrarySort = "id",
):
    return await request.app.state.library.list_entries(
        user, "planned", limit, cursor, page, q=q, media_type=media_type, sort=sort
    )


@router.put("/library/{media_id}", response_model=LibraryMutation)
async def set_entry(request: Request, user: User, media_id: UUID, body: LibraryWrite):
    return await request.app.state.library.change(user, media_id, body)


@router.put("/wishlist/{media_id}", response_model=LibraryMutation)
async def set_wishlist(request: Request, user: User, media_id: UUID, body: WishlistWrite):
    return await request.app.state.library.change(
        user, media_id, LibraryWrite(status="planned", expected_version=body.expected_version), body
    )


@router.delete("/wishlist/{media_id}", response_model=LibraryMutation)
async def remove_wishlist(
    request: Request, user: User, media_id: UUID, expected_version: int = Query(ge=1)
):
    return await request.app.state.library.remove_wishlist(user, media_id, expected_version)
