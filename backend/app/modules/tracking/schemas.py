import re
import unicodedata
from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.integrations.metadata.schemas import Media
from app.modules.tracking.policy import ProgressSummary


def canonical_key(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).strip()
    if re.fullmatch(r"\d+(?:\.\d+)?", value):
        value = format(Decimal(value).normalize(), "f")
    if not value or len(value) > 80:
        raise ValueError("Target labels must contain 1–80 characters")
    return value


class StartSession(BaseModel):
    model_config = ConfigDict(extra="forbid")
    media_id: UUID
    request_id: UUID
    repeat: bool = False
    skip_counts: bool = False
    manual_labels: list[str] = Field(default_factory=list, max_length=2000)

    @field_validator("manual_labels")
    @classmethod
    def unique_labels(cls, labels):
        normalized = [canonical_key(label) for label in labels]
        if len(set(normalized)) != len(normalized):
            raise ValueError("Duplicate target labels")
        return normalized


class ProgressWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_version: int = Field(ge=1)
    keys: list[str] = Field(min_length=1, max_length=100)
    state: Literal["watched", "read", "skipped", "unresolved"]

    @field_validator("keys")
    @classmethod
    def distinct(cls, keys):
        values = keys
        if any(not key or len(key) > 80 for key in keys):
            raise ValueError("Progress keys must contain 1-80 characters")
        if len(set(values)) != len(values):
            raise ValueError("Duplicate progress keys")
        return values


class SessionVersion(BaseModel):
    expected_version: int = Field(ge=1)


class ManualTargets(StartSession):
    session_id: UUID
    expected_version: int = Field(ge=1)


class UnitRead(BaseModel):
    key: str
    label: str
    order: int
    released: bool
    title: str | None
    released_at: datetime | None
    provenance: Literal["manual", "provider"]
    state: Literal["watched", "read", "skipped", "unresolved"]
    rating: int | None = None
    notes: str | None = None


class UnitDetails(BaseModel):
    expected_version: int = Field(ge=1)
    rating: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = Field(default=None, max_length=10000)


class SessionRead(BaseModel):
    id: UUID
    media: Media
    kind: Literal["initial", "repeat"]
    active: bool
    version: int
    skip_counts: bool
    coverage_complete: bool
    final_total: int | None
    summary: ProgressSummary
    units: list[UnitRead]
    total_units: int = 0
    next_offset: int | None
    updated_at: datetime
