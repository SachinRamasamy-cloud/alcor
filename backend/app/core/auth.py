from uuid import UUID

import jwt
from fastapi import Request
from starlette.concurrency import run_in_threadpool

from app.core.config import Settings
from app.core.errors import AppError


def verify_claims(token: str, signing_key, settings: Settings) -> UUID:
    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256", "ES256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={"require": ["exp", "iss", "aud", "sub", "role"]},
        )
        if claims["role"] != "authenticated":
            raise ValueError("End-user role required")
        return UUID(claims["sub"])
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise AppError(401, "UNAUTHORIZED", "Sign in again.") from exc


class Authenticator:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.jwks = (
            jwt.PyJWKClient(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json",
                cache_keys=True,
                lifespan=300,
                timeout=5,
            )
            if settings.supabase_url and settings.jwt_issuer
            else None
        )

    async def authenticate(self, token: str) -> UUID:
        try:
            if jwt.get_unverified_header(token).get("alg") not in {"RS256", "ES256"}:
                raise ValueError("Unsupported algorithm")
        except (jwt.PyJWTError, ValueError) as exc:
            raise AppError(401, "UNAUTHORIZED", "Sign in again.") from exc
        if not self.jwks:
            raise AppError(503, "AUTH_UNAVAILABLE", "Sign-in is not available in this environment.")
        try:
            key = await run_in_threadpool(self.jwks.get_signing_key_from_jwt, token)
        except jwt.PyJWKClientConnectionError as exc:
            raise AppError(
                503, "AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable.", retryable=True
            ) from exc
        except jwt.PyJWTError as exc:
            raise AppError(401, "UNAUTHORIZED", "Sign in again.") from exc
        return verify_claims(token, key.key, self.settings)


async def current_user(request: Request) -> UUID:
    principal = getattr(request.state, "user_id", None)
    if principal is None:
        raise AppError(401, "UNAUTHORIZED", "Sign in to continue.")
    return principal
