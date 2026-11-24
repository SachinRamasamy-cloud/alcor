import httpx
import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app


async def test_health_and_standard_not_found():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=create_app(Settings(app_env="test"))),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.headers["X-Request-ID"]
        missing = await client.get("/api/v1/unknown")
        assert missing.status_code == 404
        assert missing.json()["error"]["code"] == "NOT_FOUND"
        assert missing.json()["error"]["request_id"]


def test_production_rejects_fixture_catalogue():
    with pytest.raises(ValidationError, match="fixtures are forbidden"):
        Settings(app_env="production")
