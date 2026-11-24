from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException

from app.core.config import Settings, get_settings
from app.core.errors import AppError, app_error_handler


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    api = FastAPI(title="ALCOR API", version="0.1.0", docs_url="/api/docs")
    api.state.settings = settings
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
