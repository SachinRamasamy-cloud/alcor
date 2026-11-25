import base64
import hashlib
import json
import unicodedata
from uuid import UUID

from app.core.errors import AppError
from app.integrations.metadata.schemas import CataloguePage, CatalogueQuery, Media


def normalize(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def eligible_items(
    items: list[Media],
    query: CatalogueQuery,
    media_type: str | None = None,
    excluded: set[UUID] | None = None,
) -> list[Media]:
    search = normalize(query.q)
    filtered = [
        m
        for m in items
        if (not media_type or m.media_type == media_type)
        and (not excluded or m.id not in excluded)
        and (not query.genre or query.genre in m.genres)
        and (not query.format or query.format == m.format)
        and (not query.year or m.year == query.year)
        and all(g in m.genres for g in query.include_genres)
        and not any(g in m.genres for g in query.exclude_genres)
        and all(g in m.themes for g in query.include_themes)
        and not any(g in m.themes for g in query.exclude_themes)
        and (query.year_from is None or (m.year is not None and m.year >= query.year_from))
        and (query.year_to is None or (m.year is not None and m.year <= query.year_to))
        and (query.score_min is None or (m.score is not None and m.score >= query.score_min))
        and (
            query.units_max is None
            or (m.total_units is not None and m.total_units <= query.units_max)
        )
        and (not query.studio or query.studio in m.studios)
        and (not query.status or query.status == m.status)
        and (not query.season or query.season == m.season)
        and (
            not search
            or any(
                search in normalize(t)
                for t in [m.title, *m.aliases, *([m.synopsis or ""] if query.memory else [])]
            )
        )
    ]

    def order(m: Media):
        titles = [normalize(m.title), *(normalize(t) for t in m.aliases)]
        relevance = 0 if search in titles else 1 if any(t.startswith(search) for t in titles) else 2
        value = {
            "popular": m.popularity if m.popularity is not None else 10**9,
            "score": -(m.score if m.score is not None else -1),
            "title": normalize(m.title),
            "year": -(m.year or 0),
        }[query.sort]
        return (relevance if search else 0, value, str(m.id))

    filtered.sort(key=order)
    return filtered


def select_page(
    items: list[Media],
    query: CatalogueQuery,
    media_type: str | None = None,
    excluded: set[UUID] | None = None,
    context: str = "",
) -> CataloguePage:
    filtered = eligible_items(items, query, media_type, excluded)
    fingerprint = hashlib.sha256(
        json.dumps(
            {
                **query.model_dump(exclude={"cursor", "limit", "page"}),
                "media_type": media_type,
                "context": context,
                "excluded": sorted(str(i) for i in excluded or []),
            },
            sort_keys=True,
        ).encode()
    ).hexdigest()[:16]
    offset = ((query.page or 1) - 1) * query.limit
    if query.page is not None and query.cursor:
        raise AppError(422, "INVALID_REQUEST", "Choose a page or cursor, not both.")
    if query.cursor:
        try:
            payload = json.loads(
                base64.urlsafe_b64decode(query.cursor + "=" * (-len(query.cursor) % 4))
            )
            offset = payload["offset"]
            if (
                payload["query"] != fingerprint
                or type(offset) is not int
                or not 0 <= offset <= len(filtered)
            ):
                raise ValueError("Cursor context changed")
        except (ValueError, KeyError, TypeError, UnicodeDecodeError) as exc:
            raise AppError(422, "INVALID_CURSOR", "Reset the filters and try again.") from exc
    data = filtered[offset : offset + query.limit]
    has_more = offset + query.limit < len(filtered)
    cursor = (
        base64.urlsafe_b64encode(
            json.dumps({"offset": offset + query.limit, "query": fingerprint}).encode()
        )
        .decode()
        .rstrip("=")
        if has_more
        else None
    )
    return CataloguePage(
        data=data,
        has_more=has_more,
        next_cursor=cursor,
        page=offset // query.limit + 1,
        total=len(filtered),
        total_pages=max(1, (len(filtered) + query.limit - 1) // query.limit),
    )
