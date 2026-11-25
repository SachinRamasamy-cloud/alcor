from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.core.auth import current_user
from app.modules.collections.schemas import (
    CollectionCreate,
    CollectionDetail,
    CollectionList,
    CollectionUpdate,
    ItemWrite,
)

router = APIRouter(prefix="/api/v1/me/collections", tags=["collections"])
User = Annotated[UUID, Depends(current_user)]


@router.get("", response_model=CollectionList)
async def collections(request: Request, user: User, cursor: UUID | None = None):
    return await request.app.state.collections.list(user, cursor)


@router.post("", response_model=CollectionDetail)
async def create(request: Request, user: User, body: CollectionCreate):
    return await request.app.state.collections.create(user, body)


@router.get("/{collection_id}", response_model=CollectionDetail)
async def read(
    request: Request, user: User, collection_id: UUID, offset: int = Query(0, ge=0, le=100000)
):
    return await request.app.state.collections.read(user, collection_id, offset)


@router.patch("/{collection_id}", response_model=CollectionDetail)
async def rename(request: Request, user: User, collection_id: UUID, body: CollectionUpdate):
    return await request.app.state.collections.update(
        user, collection_id, body.expected_version, body.name
    )


@router.delete("/{collection_id}")
async def delete(
    request: Request, user: User, collection_id: UUID, expected_version: int = Query(ge=1)
):
    return await request.app.state.collections.update(
        user, collection_id, expected_version, delete=True
    )


@router.put("/{collection_id}/items/{media_id}", response_model=CollectionDetail)
async def item(request: Request, user: User, collection_id: UUID, media_id: UUID, body: ItemWrite):
    return await request.app.state.collections.item(user, collection_id, media_id, body)


@router.delete("/{collection_id}/items/{media_id}", response_model=CollectionDetail)
async def remove_item(
    request: Request,
    user: User,
    collection_id: UUID,
    media_id: UUID,
    expected_version: int = Query(ge=1),
):
    return await request.app.state.collections.item(
        user, collection_id, media_id, ItemWrite(expected_version=expected_version), remove=True
    )
