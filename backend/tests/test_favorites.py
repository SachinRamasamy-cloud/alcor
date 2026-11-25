from uuid import uuid4

import httpx

from app.core.config import Settings
from app.main import create_app


async def test_favorite_interfaces_require_real_authentication_and_are_private():
    app = create_app(Settings(app_env="test"))
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            for response in (
                await client.get("/api/v1/me/favorites"),
                await client.put(f"/api/v1/me/favorites/{uuid4()}", json={"favorite": True, "expected_preferences_version": 0}),
            ):
                assert response.status_code == 401
                assert response.json()["error"]["code"] == "UNAUTHORIZED"
                assert response.headers["cache-control"] == "private, no-store"
    finally:
        await app.state.database.close()
        await app.state.limiter.close()
