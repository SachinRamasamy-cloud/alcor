from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Preferences(BaseModel):
    model_config = ConfigDict(extra="forbid")
    timezone: str = "UTC"
    motion: Literal["system", "reduced", "full"] = "system"
    notifications: bool = False
    include_planned: bool = True
    spoiler_mode: bool = False
    preferred_genres: list[str] = Field(default_factory=list, max_length=50)
    preferred_themes: list[str] = Field(default_factory=list, max_length=50)
    preferred_studios: list[str] = Field(default_factory=list, max_length=50)
    positive_rating_min: int | None = Field(default=None, ge=1, le=10)
    minimum_rating_votes: int | None = Field(default=None, ge=1)
    preferred_max_units: int | None = Field(default=None, ge=1, le=100000)

    @field_validator("timezone")
    @classmethod
    def known_timezone(cls, value):
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("Use an IANA timezone") from exc
        return value

    @field_validator("preferred_genres", "preferred_themes", "preferred_studios")
    @classmethod
    def bounded_names(cls, values):
        values = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if any(len(v) > 100 for v in values):
            raise ValueError("Preference names must be bounded")
        return values


class PreferencesRead(BaseModel):
    data: Preferences
    version: int


class PreferencesWrite(BaseModel):
    data: Preferences
    expected_version: int = Field(ge=0)


class ProfileRead(BaseModel):
    display_name: str
    version: int


class ProfileWrite(BaseModel):
    display_name: str = Field(max_length=80)
    expected_version: int = Field(ge=0)
