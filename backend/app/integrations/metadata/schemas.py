from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class Source(BaseModel):
    name: str
    url: str
    retrieved_at: datetime
    is_fixture: bool = True


class Media(BaseModel):
    id: UUID
    external_id: str
    source_ids: dict[str, str] = {}
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
    themes: list[str] = []
    season: Literal["winter", "spring", "summer", "fall"] | None = None
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
    include_genres: list[str] = Field(default_factory=list, max_length=50)
    exclude_genres: list[str] = Field(default_factory=list, max_length=50)
    include_themes: list[str] = Field(default_factory=list, max_length=50)
    exclude_themes: list[str] = Field(default_factory=list, max_length=50)
    year_from: int | None = Field(default=None, ge=1900, le=2200)
    year_to: int | None = Field(default=None, ge=1900, le=2200)
    score_min: float | None = Field(default=None, ge=0, le=10)
    units_max: int | None = Field(default=None, ge=1, le=100000)
    studio: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, max_length=60)
    season: Literal["winter", "spring", "summer", "fall"] | None = None
    memory: bool = False

    @model_validator(mode="after")
    def valid_years(self):
        if (
            self.year_from is not None
            and self.year_to is not None
            and self.year_from > self.year_to
        ):
            raise ValueError("Year range is reversed")
        return self
