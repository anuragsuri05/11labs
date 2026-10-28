from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel, Field

from .. import store
from ..config import FILES_DIR, MAX_ISOLATION_SECONDS
from ..engines.media import isolator, music, sfx
from ..errors import APIError
from ..media_io import audio_response, stash_upload
from ..streaming import stream_failed

router = APIRouter()


@router.post("/v1/audio-isolation")
def audio_isolation(audio: UploadFile = File(...)):
    src, _ = stash_upload(audio, isolator.sample_rate, max_seconds=MAX_ISOLATION_SECONDS)
    vocals = isolator.isolate(src)
    return audio_response(vocals, isolator.sample_rate, kind="isolation", text=audio.filename or "Audio",
                          source=src, model_id="htdemucs")


class SFXRequest(BaseModel):
    text: str = Field(max_length=1000)
    duration_seconds: float | None = Field(5.0, ge=1, le=10)
    prompt_influence: float = Field(0.3, ge=0, le=1)


@router.post("/v1/sound-generation")
def sound_generation(req: SFXRequest):
    if not req.text.strip():
        raise APIError(400, "empty_text", "Describe the sound you want.")
    audio = sfx.generate(req.text.strip(), req.duration_seconds or 5.0, req.prompt_influence)
    return audio_response(audio, sfx.sample_rate, kind="sfx", text=req.text.strip(),
                          settings=req.model_dump(), model_id="audioldm")


class MusicRequest(BaseModel):
    prompt: str = Field(max_length=1000)
    music_length_ms: int = Field(15000, ge=5000, le=30000)


@router.post("/v1/music")
def compose_music(req: MusicRequest):
    if not req.prompt.strip():
        raise APIError(400, "empty_text", "Describe the music you want.")
    audio = music.generate(req.prompt.strip(), req.music_length_ms / 1000)
    return audio_response(audio, music.sample_rate, kind="music", text=req.prompt.strip(),
                          settings=req.model_dump(), model_id="musicgen-small")


@router.get("/v1/history")
def list_history(kind: str = "", limit: int = 50):
    items = [h for h in store.history.all() if not kind or h["kind"] == kind]
    return {"history": items[: max(1, min(limit, 500))]}


@router.get("/v1/history/{item_id}")
def get_history_item(item_id: str):
    item = store.history.get(item_id)
    if not item:
        if stream_failed(item_id):
            raise APIError(410, "generation_failed", "Generation stopped before it finished.")
        raise APIError(404, "not_found", "History item not found (a stream may still be generating).")
    return item


@router.delete("/v1/history/{item_id}")
def delete_history(item_id: str):
    item = store.history.delete(item_id)
    if not item:
        raise APIError(404, "not_found", "History item not found.")
    for key in ("audio_url", "source_url"):
        if item.get(key):
            path = (FILES_DIR / item[key].removeprefix("/files/")).resolve()
            if path.is_relative_to(FILES_DIR):
                path.unlink(missing_ok=True)
    return {"status": "ok"}
