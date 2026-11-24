from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Query, Request

from app.core.errors import AppError
from app.integrations.metadata.schemas import (
    CataloguePage,
    CatalogueQuery,
    EpisodePage,
    HomeResponse,
    Media,
)
from app.modules.catalogue.service import select_page

router = APIRouter(prefix="/api/v1", tags=["catalogue"])


@router.get("/home", response_model=HomeResponse)
async def home(request: Request):
    items = await request.app.state.provider.catalogue()
    anime = select_page(items, CatalogueQuery(limit=12), "anime").data
    manga = select_page(items, CatalogueQuery(limit=6), "manga").data
    return HomeResponse(
        featured=next(
            (m for m in items if m.media_type == "anime" and m.image_url and m.synopsis), None
        ),
        anime=anime,
        manga=manga,
        genres=sorted({g for m in items for g in m.genres}),
        is_fixture=request.app.state.settings.metadata_provider == "fixture",
    )


@router.get("/search", response_model=CataloguePage)
async def search(request: Request, query: Annotated[CatalogueQuery, Query()]):
    return select_page(await request.app.state.provider.catalogue(), query)


@router.get("/anime", response_model=CataloguePage)
async def anime(request: Request, query: Annotated[CatalogueQuery, Query()]):
    return select_page(await request.app.state.provider.catalogue(), query, "anime")


@router.get("/manga", response_model=CataloguePage)
async def manga(request: Request, query: Annotated[CatalogueQuery, Query()]):
    return select_page(await request.app.state.provider.catalogue(), query, "manga")


@router.get("/genres", response_model=list[str])
async def genres(request: Request):
    return sorted({g for m in await request.app.state.provider.catalogue() for g in m.genres})


@router.get("/anime/{media_id}", response_model=Media)
async def anime_details(request: Request, media_id: UUID):
    return await get_media(request, media_id, "anime")


@router.get("/manga/{media_id}", response_model=Media)
async def manga_details(request: Request, media_id: UUID):
    return await get_media(request, media_id, "manga")


async def get_media(
    request: Request, media_id: UUID, media_type: Literal["anime", "manga"] | None = None
):
    item = next(
        (
            m
            for m in await request.app.state.provider.catalogue()
            if m.id == media_id and (not media_type or m.media_type == media_type)
        ),
        None,
    )
    if not item:
        raise AppError(404, "NOT_FOUND", "This title is not available.")
    return item


@router.get("/anime/{media_id}/episodes", response_model=EpisodePage)
async def episodes(request: Request, media_id: UUID):
    await get_media(request, media_id, "anime")
    return await request.app.state.provider.episodes(media_id)
