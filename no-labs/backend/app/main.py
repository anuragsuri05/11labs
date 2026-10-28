"""NO LABS API: a free, self-hosted, ElevenLabs-compatible voice AI server."""

import logging
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .audio import AudioError
from .config import CORS_ORIGINS, FILES_DIR, IN_DIR, PREVIEW_TTL_HOURS, PREVIEWS_DIR, VERSION, WEB_DIR
from .errors import APIError
from .premade import start_background_setup
from .routes import speech, system, tools, voices
from .security import auth_middleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("nolabs")


def _cleanup_loop():
    """Delete stale voice-design previews and orphaned uploads."""
    from . import store

    while True:
        cutoff = time.time() - PREVIEW_TTL_HOURS * 3600
        for f in PREVIEWS_DIR.iterdir():
            if f.stat().st_mtime < cutoff:
                f.unlink(missing_ok=True)
        referenced = {h.get("source_url") for h in store.history.all()}
        for f in IN_DIR.iterdir():
            if f.stat().st_mtime < cutoff and f"/files/in/{f.name}" not in referenced:
                f.unlink(missing_ok=True)
        time.sleep(3600)


@asynccontextmanager
async def lifespan(_: FastAPI):
    start_background_setup()
    threading.Thread(target=_cleanup_loop, name="cleanup", daemon=True).start()
    log.info("NO LABS %s ready", VERSION)
    yield


app = FastAPI(title="NO LABS", version=VERSION, description="Free, open-source voice AI studio", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
                   allow_credentials=CORS_ORIGINS != ["*"],
                   expose_headers=["history-item-id", "x-audio-url", "x-duration-seconds", "x-model-id"])
app.middleware("http")(auth_middleware)


@app.middleware("http")
async def access_log(request: Request, call_next):
    started = time.monotonic()
    response = await call_next(request)
    if request.url.path.startswith("/v1/") and request.url.path != "/v1/health":
        log.info("%s %s -> %d (%.1fs)", request.method, request.url.path, response.status_code,
                 time.monotonic() - started)
    return response


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"detail": {"status": code, "message": message}}, status_code=status)


@app.exception_handler(APIError)
async def _api_error(_: Request, e: APIError):
    return _error(e.status, e.code, e.message)


@app.exception_handler(AudioError)
async def _audio_error(_: Request, e: AudioError):
    return _error(400, "invalid_audio", str(e))


@app.exception_handler(RequestValidationError)
async def _validation_error(_: Request, e: RequestValidationError):
    first = e.errors()[0] if e.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query", "form"))
    return _error(400, "invalid_request", f"{field}: {first.get('msg', 'invalid value')}" if field else "Invalid request.")


@app.exception_handler(ValueError)
async def _value_error(_: Request, e: ValueError):
    return _error(400, "invalid_request", str(e))


@app.exception_handler(Exception)
async def _unhandled(_: Request, e: Exception):
    log.exception("unhandled error")
    return _error(500, "internal_error", f"{type(e).__name__}: {e}")


for module in (system, voices, speech, tools):
    app.include_router(module.router)
app.mount("/files", StaticFiles(directory=FILES_DIR), name="files")


# ---------------------------------------------------------------- web UI (single-port mode)
if (WEB_DIR / "index.html").exists():
    @app.get("/{path:path}", include_in_schema=False)
    def web(path: str):
        target = (WEB_DIR / path).resolve()
        if path and target.is_file() and target.is_relative_to(WEB_DIR):
            cache = "public, max-age=31536000, immutable" if path.startswith("assets/") else "no-cache"
            return FileResponse(target, headers={"cache-control": cache})
        if path.startswith(("v1/", "files/")):
            raise APIError(404, "not_found", f"/{path} does not exist.")
        return FileResponse(WEB_DIR / "index.html", headers={"cache-control": "no-cache"})
