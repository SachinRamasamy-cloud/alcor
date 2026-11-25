from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ActivityRead(BaseModel):
    id: UUID
    media_id: UUID | None
    title: str | None
    action: str
    occurred_at: datetime
    can_undo: bool
    undone: bool
    expected_version: int | None


class HistoryPage(BaseModel):
    data: list[ActivityRead]
    next_cursor: str | None


class UndoRequest(BaseModel):
    expected_version: int = Field(ge=1)


class LibraryCounts(BaseModel):
    titles: int
    ever_completed: int
    in_progress: int
    planned: int
    favorites: int
    average_rating: float | None


class ProgressCounts(BaseModel):
    watching_events: int
    reading_events: int
    unique_episodes: int
    unique_chapters: int
    skipped: int


class GroupCount(BaseModel):
    name: str
    count: int


class StatisticsRead(BaseModel):
    library: LibraryCounts
    progress: ProgressCounts
    repeat_sessions: int
    genres: list[GroupCount]
    estimated_watch_minutes: float | None
    time_coverage: str
