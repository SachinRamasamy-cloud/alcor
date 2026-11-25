import secrets
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field

from app.core.auth import current_user
from app.core.errors import AppError
from app.integrations.metadata.schemas import CataloguePage, CatalogueQuery, Media
from app.modules.catalogue.service import eligible_items, select_page
from app.modules.discovery.schemas import (
    FilterCreate,
    FilterRead,
    FilterUpdate,
    PersonalPage,
    PersonalQuery,
)

router = APIRouter(prefix="/api/v1", tags=["discovery"])
User = Annotated[UUID, Depends(current_user)]


class CandidateReference(BaseModel):
    anilist_id: int = Field(ge=1, le=2147483647)
    mal_id: int | None = Field(default=None, ge=1, le=2147483647)
    media_type: str = Field(pattern="^(anime|manga)$")


class CandidateBatch(BaseModel):
    candidates: list[CandidateReference] = Field(max_length=100)
    mode: str = Field(pattern="^(hide_watched|new_to_me)$")


@router.post("/me/discovery-exclusions", response_model=list[int])
async def exclusions(request: Request, user: User, body: CandidateBatch):
    return await request.app.state.discovery.exclusions(user, body)


@router.get("/me/discover", response_model=PersonalPage)
async def discover(request: Request, user: User, query: Annotated[PersonalQuery, Query()]):
    return await request.app.state.discovery.discover(user, query)


@router.get("/discover/random", response_model=Media)
async def random_title(request: Request, query: Annotated[CatalogueQuery, Query()]):
    candidates = eligible_items(await request.app.state.provider.catalogue(), query)
    if not candidates:
        raise AppError(404, "NOT_FOUND", "No eligible titles are available.")
    return secrets.choice(candidates)


@router.get("/discover/hidden-gems", response_model=CataloguePage)
async def hidden_gems(
    request: Request,
    min_score: float = Query(ge=0, le=10),
    min_votes: int = Query(ge=1),
    min_popularity_rank: int = Query(ge=1),
    limit: int = Query(24, ge=1, le=100),
    cursor: str | None = Query(None, max_length=512),
):
    items = [
        m
        for m in await request.app.state.provider.catalogue()
        if m.score is not None
        and m.score >= min_score
        and m.rating_count is not None
        and m.rating_count >= min_votes
        and m.popularity is not None
        and m.popularity >= min_popularity_rank
    ]
    return select_page(
        items,
        CatalogueQuery(limit=limit, cursor=cursor, sort="score"),
        context=f"{min_score}:{min_votes}:{min_popularity_rank}",
    )


@router.get("/me/saved-filters", response_model=list[FilterRead])
async def filters(request: Request, user: User):
    return await request.app.state.discovery.filters(user)


@router.post("/me/saved-filters", response_model=FilterRead)
async def save_filter(request: Request, user: User, body: FilterCreate):
    return await request.app.state.discovery.save_filter(user, body)


@router.patch("/me/saved-filters/{filter_id}", response_model=FilterRead)
async def update_filter(request: Request, user: User, filter_id: UUID, body: FilterUpdate):
    return await request.app.state.discovery.save_filter(user, body, filter_id)


@router.delete("/me/saved-filters/{filter_id}")
async def delete_filter(
    request: Request, user: User, filter_id: UUID, expected_version: int = Query(ge=1)
):
    return await request.app.state.discovery.delete_filter(user, filter_id, expected_version)
