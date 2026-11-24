import httpx
import pytest

from app.core.config import Settings
from app.integrations.metadata.provider import FixtureProvider
from app.integrations.metadata.schemas import CatalogueQuery
from app.main import create_app
from app.modules.catalogue.service import select_page


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def test_guest_search_alias_details_and_bounded_pagination():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=create_app(Settings(app_env="test"))),
        base_url="http://test",
    ) as client:
        home = (await client.get("/api/v1/home")).json()
        assert home["is_fixture"] is True
        assert home["featured"]["source"]["retrieved_at"]
        title = home["featured"]
        response = await client.get("/api/v1/search", params={"q": title["aliases"][0]})
        assert title["id"] in [m["id"] for m in response.json()["data"]]
        details = await client.get(f"/api/v1/anime/{title['id']}")
        assert details.status_code == 200
        assert details.json()["score"] == title["score"]
        page = (await client.get("/api/v1/anime?limit=2")).json()
        assert len(page["data"]) == 2 and page["has_more"]
        second = (
            await client.get("/api/v1/anime", params={"limit": 2, "cursor": page["next_cursor"]})
        ).json()
        assert not {m["id"] for m in page["data"]} & {m["id"] for m in second["data"]}
        assert (await client.get("/api/v1/anime?limit=101")).status_code == 422
        assert (await client.get("/api/v1/anime?cursor=malformed")).status_code == 422
        assert (await client.get(f"/api/v1/manga/{title['id']}")).status_code == 404


async def test_exclusions_precede_pagination_and_nulls_stay_null():
    items = await FixtureProvider().catalogue()
    first = select_page(items, CatalogueQuery(limit=2), "anime")
    excluded = {m.id for m in first.data}
    filtered = select_page(items, CatalogueQuery(limit=2), "anime", excluded)
    assert len(filtered.data) == 2
    assert not excluded & {m.id for m in filtered.data}
    unknown = items[0].model_copy(update={"score": None, "total_units": None})
    assert unknown.model_dump()["score"] is None
    assert unknown.model_dump()["total_units"] is None


async def test_provider_failure_is_not_empty_success():
    api = create_app(Settings(app_env="test", metadata_provider="disabled"))
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/search?q=anything")
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "UPSTREAM_UNAVAILABLE"
        assert "data" not in response.json()
