from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.core.auth import current_user
from app.modules.preferences.schemas import (
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
