import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router

logger = logging.getLogger(__name__)

app = FastAPI(title="Requirements Extractor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    message = str(errors[0]["msg"]) if errors else "Ungültige Anfrage."
    return JSONResponse(
        status_code=422,
        content={"error": "VALIDATION_ERROR", "message": message},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "Ein unerwarteter Fehler ist aufgetreten.",
        },
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
