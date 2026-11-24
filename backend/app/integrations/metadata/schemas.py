from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class Source(BaseModel):
    name: str
    url: str
    retrieved_at: datetime
    is_fixture: bool = True


class Media(BaseModel):
    id: UUID
    external_id: str
    media_type: Literal["anime", "manga"]
    title: str
    original_title: str | None = None
    aliases: list[str] = []
    synopsis: str | None = None
    image_url: str | None = None
    format: str | None = None
    status: str | None = None
    year: int | None = None
    score: float | None = None
    rating_count: int | None = None
    popularity: int | None = None
    total_units: int | None = None
    genres: list[str] = []
    studios: list[str] = []
    content_rating: str | None = None
    source: Source


class Episode(BaseModel):
    key: str
    order: int
    label: str
    title: str | None = None
    released_at: datetime | None = None
    filler: bool = False
    recap: bool = False


class CataloguePage(BaseModel):
    data: list[Media]
    next_cursor: str | None = None
    has_more: bool = False
    is_partial: bool = True
    is_stale: bool = False
    source: str = "Development snapshot"


class EpisodePage(BaseModel):
    data: list[Episode] = []
    coverage_complete: bool = False
    confirmed_final_total: int | None = None
    source: str = "Development snapshot"


class ErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HomeResponse(BaseModel):
    featured: Media | None
    anime: list[Media]
    manga: list[Media]
    genres: list[str]
    is_fixture: bool
    is_partial: bool = True


class CatalogueQuery(BaseModel):
    q: str = Field(default="", max_length=200)
    genre: str | None = Field(default=None, max_length=80)
    format: str | None = Field(default=None, max_length=40)
    year: int | None = Field(default=None, ge=1900, le=2200)
    sort: Literal["popular", "score", "title", "year"] = "popular"
    limit: int = Field(default=24, ge=1, le=100)
    cursor: str | None = Field(default=None, max_length=512)
