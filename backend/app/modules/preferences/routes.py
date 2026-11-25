from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.core.auth import current_user
from app.modules.preferences.schemas import (
    FavoriteMutation,
    FavoritesPage,
    FavoriteWrite,
    PreferencesRead,
    PreferencesWrite,
    ProfileRead,
    ProfileWrite,
    SetupRead,
    SetupWrite,
)

router = APIRouter(prefix="/api/v1/me", tags=["preferences"])
User = Annotated[UUID, Depends(current_user)]


@router.get("/setup", response_model=SetupRead)
async def setup(request: Request, user: User):
    return await request.app.state.preferences.setup(user)


@router.put("/setup", response_model=SetupRead)
async def save_setup(request: Request, user: User, body: SetupWrite):
    return await request.app.state.preferences.save_setup(user, body)


@router.get("", response_model=ProfileRead)
async def profile(request: Request, user: User):
    return await request.app.state.preferences.profile(user)


@router.patch("", response_model=ProfileRead)
async def update_profile(request: Request, user: User, body: ProfileWrite):
    return await request.app.state.preferences.update_profile(user, body)


@router.get("/preferences", response_model=PreferencesRead)
async def preferences(request: Request, user: User):
    return await request.app.state.preferences.read(user)


@router.patch("/preferences", response_model=PreferencesRead)
async def update_preferences(request: Request, user: User, body: PreferencesWrite):
    return await request.app.state.preferences.write(user, body)


@router.get("/favorites", response_model=FavoritesPage)
async def favorites(request: Request, user: User, limit: int = Query(24, ge=1, le=100),
                    cursor: str | None = Query(None, max_length=150),
                    ids: Annotated[list[UUID] | None, Query(max_length=100)] = None):
    return await request.app.state.preferences.favorite_page(user, limit, cursor, ids)


@router.put("/favorites/{media_id}", response_model=FavoriteMutation)
async def set_favorite(request: Request, user: User, media_id: UUID, body: FavoriteWrite):
    return await request.app.state.preferences.set_favorite(user, media_id, body)
