from datetime import date
from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.integrations.metadata.schemas import Media


class IntelligenceProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal[1] = 1
    setup_status: Literal["completed", "skipped"] = "completed"
    started_year: int | None = Field(default=None, ge=1, le=9999)
    media_types: list[Literal["anime", "manga", "manhwa", "manhua", "light_novel"]] = Field(
        default_factory=list, max_length=5
    )
    favorite_anime_ids: list[UUID] = Field(default_factory=list, max_length=10)
    story_traits: list[str] = Field(default_factory=list, max_length=20)
    disliked_genres: list[str] = Field(default_factory=list, max_length=50)
    excluded_genres: list[str] = Field(default_factory=list, max_length=50)
    series_status: Literal["any", "finished", "ongoing"] = "any"
    max_anime_episodes: int | None = Field(default=None, ge=1, le=100000)

    @field_validator("started_year")
    @classmethod
    def past_start(cls, value):
        if value is not None and value > date.today().year:
            raise ValueError("The start year cannot be in the future")
        return value

    @field_validator("story_traits", "disliked_genres", "excluded_genres")
    @classmethod
    def bounded_names(cls, values):
        values = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if any(len(value) > 100 for value in values):
            raise ValueError("Preference names must be bounded")
        return values

    @field_validator("favorite_anime_ids", "media_types")
    @classmethod
    def distinct_values(cls, values):
        return list(dict.fromkeys(values))

    @model_validator(mode="after")
    def distinct_negative_preferences(self):
        if {v.casefold() for v in self.disliked_genres} & {
            v.casefold() for v in self.excluded_genres
        }:
            raise ValueError("Use one dislike or exclusion choice per genre")
        return self


class Preferences(BaseModel):
    model_config = ConfigDict(extra="forbid")
    timezone: str = "UTC"
    motion: Literal["system", "reduced", "full"] = "system"
    notifications: bool = False
    include_planned: bool = True
    discovery_mode: Literal["all", "hide_watched", "new_to_me"] = "new_to_me"
    spoiler_mode: bool = False
    preferred_genres: list[str] = Field(default_factory=list, max_length=50)
    preferred_themes: list[str] = Field(default_factory=list, max_length=50)
    preferred_studios: list[str] = Field(default_factory=list, max_length=50)
    positive_rating_min: int | None = Field(default=None, ge=1, le=10)
    minimum_rating_votes: int | None = Field(default=None, ge=1)
    preferred_max_units: int | None = Field(default=None, ge=1, le=100000)
    intelligence_profile: IntelligenceProfile | None = None

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


class SetupRead(BaseModel):
    profile: ProfileRead
    preferences: PreferencesRead
    favorites: list[Media] = []


class SetupWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    display_name: str = Field(max_length=80)
    expected_profile_version: int = Field(ge=0)
    expected_preferences_version: int = Field(ge=0)
    data: Preferences

    @model_validator(mode="after")
    def requires_setup_answers(self):
        if self.data.intelligence_profile is None:
            raise ValueError("Setup requires an explicit profile or skip choice")
        return self
