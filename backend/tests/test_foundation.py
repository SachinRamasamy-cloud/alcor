import os
from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from pydantic import ValidationError

from app.core.auth import current_user
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


async def test_unapproved_production_provider_resolution_is_disabled():
    app = create_app(
        Settings(
            app_env="production",
            metadata_provider="disabled",
            supabase_url="https://identity.example",
            jwt_issuer="https://identity.example/auth/v1",
            allowed_origins=["https://alcor.example"],
        )
    )
    app.dependency_overrides[current_user] = lambda: uuid4()
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/api/v1/me/media/resolve", json={"anilist_id": 1})
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "PROVIDER_NOT_CONFIGURED"


@pytest.mark.integration
@pytest.mark.skipif(
    os.environ.get("ALCOR_RUN_INTEGRATION") != "1", reason="Local services opt-in required"
)
async def test_readiness_requires_database_and_redis(monkeypatch):
    app = create_app(Settings(app_env="test"))
    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            assert (await client.get("/api/v1/ready")).json() == {"status": "ready"}
            monkeypatch.setattr(
                app.state.limiter.redis,
                "ping",
                AsyncMock(side_effect=ConnectionError("dependency unavailable")),
            )
            response = await client.get("/api/v1/ready")
            assert response.status_code == 503
            assert response.json()["error"]["code"] == "BACKEND_WAKING"
            # Liveness must not claim private readiness.
            assert (await client.get("/api/v1/health")).status_code == 200
    finally:
        await app.state.database.close()
        await app.state.limiter.close()
