from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.integrations.metadata.schemas import CataloguePage, CatalogueQuery
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
