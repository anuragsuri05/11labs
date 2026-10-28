"""Optional access-key protection (enabled by setting NOLABS_API_KEY)."""

import hashlib
import hmac

from fastapi import Request
from fastapi.responses import JSONResponse

from .config import API_KEY

COOKIE = "nolabs_session"
OPEN_PATHS = {"/v1/health", "/v1/auth/login", "/v1/auth/logout"}


def session_token(key: str) -> str:
    return hmac.new(key.encode(), b"nolabs-session-v1", hashlib.sha256).hexdigest()


def key_matches(candidate: str | None) -> bool:
    return bool(API_KEY and candidate) and hmac.compare_digest(candidate, API_KEY)


def is_authorized(request: Request) -> bool:
    if not API_KEY:
        return True
    if key_matches(request.headers.get("xi-api-key")):
        return True
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer ") and key_matches(auth[7:].strip()):
        return True
    cookie = request.cookies.get(COOKIE)
    return bool(cookie) and hmac.compare_digest(cookie, session_token(API_KEY))


async def auth_middleware(request: Request, call_next):
    path = request.url.path
    protected = path.startswith(("/v1/", "/files/")) and path not in OPEN_PATHS
    if protected and request.method != "OPTIONS" and not is_authorized(request):
        return JSONResponse({"detail": {"status": "unauthorized", "message": "A valid access key is required."}},
                            status_code=401)
    return await call_next(request)
