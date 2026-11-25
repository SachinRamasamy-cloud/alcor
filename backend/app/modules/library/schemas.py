from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, computed_field

from app.integrations.metadata.schemas import Media
from app.modules.library.policy import TRANSITIONS, completion_unavailable

LibraryStatus = Literal[
    "planned", "in_progress", "completed", "on_hold", "dropped", "not_interested"
]
LibrarySort = Literal["id", "title", "saved", "completion_recorded", "rating", "recorded_units"]


class LibraryWrite(BaseModel):
    status: LibraryStatus
    expected_version: int | None = Field(default=None, ge=1)


class WishlistWrite(BaseModel):
    priority: Literal["high", "normal", "low"] = "normal"
    reason: str | None = Field(default=None, max_length=1000)
    expected_version: int | None = Field(default=None, ge=1)


class ActiveSession(BaseModel):
    id: UUID
    kind: Literal["initial", "repeat"]
    version: int


class LibraryEntry(BaseModel):
    media: Media
    status: LibraryStatus
    ever_completed: bool
    version: int
    priority: Literal["high", "normal", "low"]
    reason: str | None
    rating: int | None
    notes: str | None
    favorite: bool
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    deleted_at: datetime | None
    active_session: ActiveSession | None = None
    completion_recorded_at: datetime | None = None
    recorded_units: int | None = None

    @computed_field
    @property
    def allowed_statuses(self) -> list[LibraryStatus]:
        statuses = TRANSITIONS[self.status] if self.deleted_at is None else set()
        if self.active_session or completion_unavailable(self.media.status):
            statuses = statuses - {"completed"}
        return sorted(statuses)


class LibraryQueryContext(BaseModel):
    q: str = ""
    media_type: Literal["anime", "manga"] | None = None
    status: LibraryStatus | None = None
    sort: LibrarySort = "id"


class LibraryPage(BaseModel):
    data: list[LibraryEntry]
    next_cursor: str | None
    total: int
    page: int = 1
    total_pages: int = 1
    query_context: LibraryQueryContext | None = None


class LibraryMutation(BaseModel):
    entry: LibraryEntry
    changed: bool


class LibraryDetails(BaseModel):
    expected_version: int = Field(ge=1)
    rating: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = Field(default=None, max_length=10000)
    favorite: bool | None = None
    tags: list[str] | None = Field(default=None, max_length=30)
    priority: Literal["high", "normal", "low"] | None = None
    reason: str | None = Field(default=None, max_length=1000)
