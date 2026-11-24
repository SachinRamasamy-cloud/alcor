from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException

from app.core.auth import Authenticator
from app.core.config import Settings, get_settings
from app.core.errors import AppError, app_error_handler
from app.infrastructure.database import Database
from app.infrastructure.limits import RateLimiter
from app.integrations.metadata.provider import DisabledProvider, FixtureProvider
from app.modules.catalogue.routes import router as catalogue_router
from app.modules.library.routes import router as library_router
from app.modules.library.service import LibraryService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(api):
        yield
        await api.state.database.close()
        await api.state.limiter.close()

    api = FastAPI(title="ALCOR API", version="0.1.0", docs_url="/api/docs", lifespan=lifespan)
    api.state.settings = settings
    api.state.provider = (
        FixtureProvider() if settings.metadata_provider == "fixture" else DisabledProvider()
    )
    api.include_router(catalogue_router)
    api.state.database = Database(settings.database_url.get_secret_value())
    api.state.limiter = RateLimiter(settings.redis_url.get_secret_value())
    api.state.auth = Authenticator(settings)
    api.state.library = LibraryService(api.state.database, api.state.provider)
    api.include_router(library_router)
    api.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
        expose_headers=["X-Request-ID", "Retry-After"],
    )

    @api.middleware("http")
    async def request_context(request: Request, call_next):
        request.state.request_id = str(uuid4())
        request.state.user_id = None
        try:
            authorization = request.headers.get("Authorization")
            if authorization:
                scheme, _, token = authorization.partition(" ")
                if scheme.lower() != "bearer" or not token:
                    raise AppError(401, "UNAUTHORIZED", "Sign in again.")
                request.state.user_id = await api.state.auth.authenticate(token)
            # Public fixture reads never contact an external provider. Private
            # endpoints use shared Redis quotas and fail closed on limiter loss.
            if request.url.path.startswith("/api/v1/me") and request.state.user_id:
                write = request.method not in {"GET", "HEAD", "OPTIONS"}
                budget = 30 if "wishlist" in request.url.path and write else 60 if write else 180
                retry_after = await api.state.limiter.check(
                    f"{request.state.user_id}:{'write' if write else 'read'}", budget
                )
                if retry_after:
                    response = await app_error_handler(
                        request, AppError(429, "RATE_LIMITED", "Try again later.", retryable=True)
                    )
                    response.headers["Retry-After"] = str(retry_after)
                    return response
        except AppError as exc:
            return await app_error_handler(request, exc)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if request.url.path.startswith("/api/v1/me"):
            response.headers["Cache-Control"] = "private, no-store"
        return response

    api.add_exception_handler(AppError, app_error_handler)

    @api.exception_handler(RequestValidationError)
    async def invalid_input(request, exc):
        return await app_error_handler(
            request, AppError(422, "INVALID_REQUEST", "Check the submitted values.")
        )

    @api.exception_handler(HTTPException)
    async def http_error(request, exc):
        code = "NOT_FOUND" if exc.status_code == 404 else "REQUEST_FAILED"
        return await app_error_handler(
            request, AppError(exc.status_code, code, "The request could not be completed.")
        )

    @api.get("/api/v1/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.0"}

    return api


app = create_app()
