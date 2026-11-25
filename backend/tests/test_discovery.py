from uuid import NAMESPACE_URL, uuid5

import httpx

from app.core.config import Settings
from app.integrations.metadata.provider import FixtureProvider
from app.integrations.metadata.schemas import CatalogueQuery
from app.main import create_app
from app.modules.catalogue.service import select_page


async def test_advanced_filters_and_unknown_values():
    base = (await FixtureProvider().catalogue())[0]
    a = base.model_copy(
        update={
            "id": uuid5(NAMESPACE_URL, "filter-a"),
            "year": 2024,
            "genres": ["Fantasy"],
            "themes": ["Travel"],
            "studios": ["Studio"],
            "season": "spring",
            "total_units": 12,
            "score": 8.5,
        }
    )
    b = base.model_copy(
        update={
            "id": uuid5(NAMESPACE_URL, "filter-b"),
            "year": None,
            "genres": ["Fantasy", "Horror"],
            "themes": [],
            "studios": [],
            "season": None,
            "total_units": None,
            "score": None,
        }
    )
    query = CatalogueQuery(
        include_genres=["Fantasy"],
        exclude_genres=["Horror"],
        include_themes=["Travel"],
        year_from=2023,
        year_to=2025,
        studio="Studio",
        season="spring",
        score_min=8,
        units_max=13,
    )
    assert [m.id for m in select_page([a, b], query).data] == [a.id]
    memory = CatalogueQuery(q="memory keyword", memory=True)
    a = a.model_copy(update={"synopsis": "A memory keyword in the available synopsis."})
    assert select_page([a, b], memory).data[0].id == a.id


async def test_random_is_an_actual_eligible_title_and_hidden_gems_requires_explicit_thresholds():
    api = create_app(Settings(app_env="test"))
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api), base_url="http://test"
    ) as client:
        picked = await client.get("/api/v1/discover/random?genre=Fantasy")
        assert picked.status_code == 200 and "Fantasy" in picked.json()["genres"]
        assert (await client.get("/api/v1/discover/hidden-gems")).status_code == 422
        found = await client.get(
            "/api/v1/discover/hidden-gems?min_score=8&min_votes=1&min_popularity_rank=1"
        )
        assert found.status_code == 200 and found.json()["is_partial"]
