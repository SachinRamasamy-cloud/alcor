"""Fixed public lookup used to verify a source identity before a private save."""

import re
from datetime import UTC, datetime
from html import unescape
from uuid import NAMESPACE_URL, uuid5

import httpx

from app.core.errors import AppError
from app.integrations.metadata.schemas import Media, Source

QUERY = """query AlcorResolve($id: Int!) {
  Media(id: $id, isAdult: false) {
    id idMal type title { romaji english native } synonyms description(asHtml: false)
    coverImage { large } format status season seasonYear startDate { year }
    episodes chapters averageScore genres studios(isMain: true) { nodes { name } } isAdult
  }
}"""


def map_media(item: dict) -> Media:
    source_id = str(item["id"])
    kind = "anime" if item["type"] == "ANIME" else "manga"
    if item.get("isAdult") or item["type"] not in {"ANIME", "MANGA"}:
        raise AppError(404, "NOT_FOUND", "This title is not available.")
    titles = item["title"]
    image = (item.get("coverImage") or {}).get("large")
    source_ids = {"anilist": source_id}
    if item.get("idMal"):
        source_ids["mal"] = str(item["idMal"])
    return Media(
        id=uuid5(NAMESPACE_URL, f"anilist:{kind}:{source_id}"),
        external_id=f"anilist:{source_id}",
        source_ids=source_ids,
        media_type=kind,
        title=titles.get("english") or titles.get("romaji") or titles.get("native") or source_id,
        original_title=titles.get("native"),
        aliases=[t for t in [titles.get("romaji"), *(item.get("synonyms") or [])] if t],
        synopsis=unescape(re.sub(r"<[^>]*>", "", item.get("description") or "")) or None,
        image_url=image if image and image.startswith("https://s4.anilist.co/") else None,
        format={
            "NOVEL": "Light Novel",
            "MANGA": "Manga",
            "MOVIE": "Movie",
            "SPECIAL": "Special",
        }.get(item.get("format"), item.get("format")),
        status=item.get("status"),
        season=(item.get("season") or "").lower() or None,
        year=item.get("seasonYear") or (item.get("startDate") or {}).get("year"),
        score=item["averageScore"] / 10 if item.get("averageScore") is not None else None,
        total_units=item.get("episodes" if kind == "anime" else "chapters"),
        genres=item.get("genres") or [],
        studios=[s["name"] for s in (item.get("studios") or {}).get("nodes", [])],
        source=Source(
            name="AniList",
            url=f"https://anilist.co/{kind}/{source_id}",
            retrieved_at=datetime.now(UTC),
            is_fixture=False,
        ),
    )


async def fetch_media(source_id: int) -> Media:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.post(
                "https://graphql.anilist.co", json={"query": QUERY, "variables": {"id": source_id}}
            )
        if response.status_code == 429:
            raise AppError(429, "RATE_LIMITED", "Try again later.", retryable=True)
        response.raise_for_status()
        body = response.json()
        item = body.get("data", {}).get("Media")
        if not item:
            raise AppError(
                404 if not body.get("errors") else 503,
                "UPSTREAM_UNAVAILABLE" if body.get("errors") else "NOT_FOUND",
                "This title is not available.",
                retryable=bool(body.get("errors")),
            )
        if item["id"] != source_id:
            raise ValueError("Source identity mismatch")
        return map_media(item)
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise AppError(
            503, "UPSTREAM_UNAVAILABLE", "The source is temporarily unavailable.", retryable=True
        ) from exc
