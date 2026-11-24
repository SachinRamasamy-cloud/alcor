import json
from pathlib import Path
from typing import Protocol
from uuid import UUID

from app.core.errors import AppError
from app.integrations.metadata.schemas import EpisodePage, Media


class MetadataProvider(Protocol):
    async def catalogue(self) -> list[Media]: ...
    async def episodes(self, media_id: UUID) -> EpisodePage: ...


class FixtureProvider:
    """Finite, attributed development data. Never enabled in staging/production."""

    def __init__(self):
        directory = Path(__file__).parent / "fixtures"
        self.items = [
            Media.model_validate(item)
            for item in json.loads((directory / "catalogue.json").read_text(encoding="utf-8"))
        ]
        self.episode_data = json.loads((directory / "episodes.json").read_text(encoding="utf-8"))

    async def catalogue(self) -> list[Media]:
        return self.items

    async def episodes(self, media_id: UUID) -> EpisodePage:
        return EpisodePage.model_validate(self.episode_data.get(str(media_id), {}))


class DisabledProvider:
    async def catalogue(self) -> list[Media]:
        raise AppError(
            503,
            "UPSTREAM_UNAVAILABLE",
            "Catalogue information is temporarily unavailable.",
            retryable=True,
        )

    async def episodes(self, media_id: UUID) -> EpisodePage:
        raise AppError(
            503,
            "UPSTREAM_UNAVAILABLE",
            "Episode information is temporarily unavailable.",
            retryable=True,
        )
