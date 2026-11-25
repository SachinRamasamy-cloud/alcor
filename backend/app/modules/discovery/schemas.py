from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.integrations.metadata.schemas import CataloguePage, CatalogueQuery, Media
from app.modules.library.schemas import LibraryStatus


class PersonalQuery(CatalogueQuery):
    media_type: Literal["anime", "manga"] | None = None
    mode: Literal["all", "hide_watched", "new_to_me"] = "all"
    include_planned: bool | None = None


class StatusOverlay(BaseModel):
    status: LibraryStatus
    ever_completed: bool
    favorite: bool
    version: int


class PersonalPage(CataloguePage):
    personal_status: dict[str, StatusOverlay]


class FilterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    query: PersonalQuery
    request_id: UUID


class FilterUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    query: PersonalQuery
    expected_version: int = Field(ge=1)


class FilterRead(BaseModel):
    id: UUID
    name: str
    query: PersonalQuery
    version: int


FeedbackContext = Literal["favorites", "taste", "similar", "management"]


class FeedbackWrite(BaseModel):
    dismissed: bool
    expected_version: int = Field(ge=0)
    context: FeedbackContext


class FeedbackRead(BaseModel):
    media_id: UUID | None
    dismissed: bool
    version: int
    updated_at: datetime | None = None
    context: FeedbackContext | None = None


class FeedbackMutation(FeedbackRead):
    changed: bool


class FeedbackItem(FeedbackRead):
    media: Media


class FeedbackPage(BaseModel):
    data: list[FeedbackItem]
    total: int
    next_cursor: str | None


class CandidateFeedback(FeedbackRead):
    anilist_id: int
