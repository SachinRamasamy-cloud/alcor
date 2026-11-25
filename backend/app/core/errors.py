from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(
        self,
        status: int,
        code: str,
        message: str,
        *,
        retryable: bool = False,
        retry_after: int | None = None,
    ):
        self.status = status
        self.code = code
        self.message = message
        self.retryable = retryable
        self.retry_after = retry_after


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    headers = {"Cache-Control": "private, no-store", "X-Request-ID": request.state.request_id}
    if exc.retry_after is not None:
        headers["Retry-After"] = str(exc.retry_after)
    return JSONResponse(
        status_code=exc.status,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "retryable": exc.retryable,
                "request_id": request.state.request_id,
            }
        },
        headers=headers,
    )
