"""Domain exceptions and their FastAPI handlers.

Every error leaves the API as `{ "error": <message>, "code": <ERROR_CODE> }`
(see ARCHITECTURE NOTES #5) so the frontend can show localized messages.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base class for expected, client-facing errors."""

    def __init__(self, message: str, code: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class InvalidFENError(AppError):
    def __init__(self, message: str = "Invalid FEN position."):
        super().__init__(message, "INVALID_FEN", status_code=422)


class StockfishUnavailableError(AppError):
    def __init__(self, message: str = "Stockfish engine is unavailable."):
        super().__init__(message, "STOCKFISH_UNAVAILABLE", status_code=503)


class LLMError(AppError):
    def __init__(self, message: str = "The AI provider failed to respond."):
        super().__init__(message, "LLM_ERROR", status_code=502)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "code": exc.code},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {"msg": "Invalid request."}
        return JSONResponse(
            status_code=422,
            content={"error": first.get("msg", "Invalid request."), "code": "VALIDATION_ERROR"},
        )

    @app.exception_handler(Exception)
    async def _unexpected_handler(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred.", "code": "INTERNAL_ERROR"},
        )
