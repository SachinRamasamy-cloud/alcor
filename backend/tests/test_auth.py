import time
from uuid import uuid4

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.auth import verify_claims
from app.core.config import Settings
from app.core.errors import AppError
from app.main import create_app

SETTINGS = Settings(app_env="test", jwt_issuer="https://example.supabase.co/auth/v1")


@pytest.fixture(scope="module")
def key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def claims(**updates):
    return {
        "iss": SETTINGS.jwt_issuer,
        "aud": "authenticated",
        "sub": str(uuid4()),
        "role": "authenticated",
        "exp": int(time.time()) + 300,
        **updates,
    }


def test_valid_signature_and_uuid_subject(key):
    data = claims()
    token = jwt.encode(data, key, algorithm="RS256")
    assert str(verify_claims(token, key.public_key(), SETTINGS)) == data["sub"]


@pytest.mark.parametrize(
    "changes",
    [
        {"iss": "wrong"},
        {"aud": "wrong"},
        {"exp": 1},
        {"nbf": 9999999999},
        {"role": "service_role"},
        {"sub": "not-a-user"},
    ],
)
def test_invalid_claims_rejected(key, changes):
    with pytest.raises(AppError) as result:
        verify_claims(
            jwt.encode(claims(**changes), key, algorithm="RS256"), key.public_key(), SETTINGS
        )
    assert result.value.status == 401


def test_wrong_signature_and_algorithm_rejected(key):
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    for token in [
        jwt.encode(claims(), other, algorithm="RS256"),
        jwt.encode(claims(), "test-only-key-which-is-not-a-runtime-secret", algorithm="HS256"),
    ]:
        with pytest.raises(AppError):
            verify_claims(token, key.public_key(), SETTINGS)


async def test_private_routes_require_identity_and_bad_public_token_is_rejected():
    api = create_app(Settings(app_env="test"))
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=api), base_url="http://test"
    ) as client:
        private = await client.get("/api/v1/me/library")
        assert private.status_code == 401
        assert private.headers["Cache-Control"] == "private, no-store"
        public = await client.get("/api/v1/search", headers={"Authorization": "Bearer invalid"})
        assert public.status_code == 401
        assert public.json()["error"]["code"] == "UNAUTHORIZED"
