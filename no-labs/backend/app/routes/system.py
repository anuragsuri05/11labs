from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .. import store
from ..config import API_KEY, DEVICE, VERSION
from ..engines import all_engines, jobs
from ..engines.media import stt
from ..engines.tts import TTS_ENGINES
from ..errors import APIError
from ..security import COOKIE, key_matches, session_token

router = APIRouter()


@router.get("/v1/health")
def health():
    return {"status": "ok", "version": VERSION, "device": DEVICE, "auth": bool(API_KEY),
            "queue": jobs.snapshot(), "engines": {e.name: e.status for e in all_engines()}}


@router.get("/v1/models")
def models():
    counts: dict[str, int] = {}
    for v in store.voices.all():
        counts[v.get("model_id", "omnivoice")] = counts.get(v.get("model_id", "omnivoice"), 0) + 1
    return [{**e.describe(), "voice_count": counts.get(e.model_id, 0), "can_do_text_to_speech": True}
            for e in TTS_ENGINES.values()]


@router.get("/v1/speech-to-text/models")
def stt_models():
    return stt.list_models()


class Login(BaseModel):
    key: str


@router.post("/v1/auth/login")
def login(body: Login):
    if not API_KEY:
        return {"status": "ok"}
    if not key_matches(body.key.strip()):
        raise APIError(401, "unauthorized", "That access key is not correct.")
    resp = JSONResponse({"status": "ok"})
    resp.set_cookie(COOKIE, session_token(API_KEY), httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30)
    return resp


@router.post("/v1/auth/logout")
def logout():
    resp = JSONResponse({"status": "ok"})
    resp.delete_cookie(COOKIE)
    return resp
