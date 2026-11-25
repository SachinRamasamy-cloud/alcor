from uuid import uuid4

import httpx
import pytest

from app.core.config import Settings
from app.core.errors import AppError
from app.integrations.metadata import anilist
from app.main import create_app


async def test_resolver_keeps_shared_budget_and_returns_retry_after():
    api = create_app(Settings(app_env="test"))
    owner = uuid4()

    class Auth:
        async def authenticate(self, _):
            return owner

    class Limiter:
        calls = []

        async def check(self, scope, minute, second=0):
            self.calls.append((scope, minute, second))
            return 7 if scope == "anilist:resolve" else 0

    api.state.auth = Auth()
    api.state.limiter = Limiter()
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/me/media/resolve",
            json={"anilist_id": 1},
            headers={"Authorization": "Bearer test-only"},
        )
    assert response.status_code == 429
    assert response.headers["Retry-After"] == "7"
    assert response.json()["error"]["code"] == "RATE_LIMITED"
    assert api.state.limiter.calls == [(f"{owner}:write", 60, 0), ("anilist:resolve", 24, 1)]


async def test_upstream_cooldown_survives_the_verified_identity_boundary(monkeypatch):
    client_type = httpx.AsyncClient
    transport = httpx.MockTransport(lambda _: httpx.Response(429, headers={"Retry-After": "13"}))
    monkeypatch.setattr(
        anilist.httpx, "AsyncClient", lambda **kwargs: client_type(transport=transport, **kwargs)
    )
    with pytest.raises(AppError) as limited:
        await anilist.fetch_media(1)
    assert limited.value.status == 429
    assert limited.value.retry_after == 13
