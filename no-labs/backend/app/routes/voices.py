import json
import shutil

import numpy as np
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .. import store
from ..audio import duration, save
from ..catalog import KOKORO_VOICES, OMNI_VOICES, POCKET_VOICES, omni_voice_id
from ..config import INTERNAL_STT, MAX_CLONE_SECONDS, PREVIEWS_DIR, SAMPLE_RATE, VOICES_DIR
from ..engines.media import stt
from ..engines.tts import TTS_ENGINES, omnivoice
from ..errors import APIError
from ..media_io import stash_upload, url_for
from ..premade import preview_path

router = APIRouter()

_ORDER = {"omnivoice": 0, "kokoro": 1, "pocket": 2}
_PREMADE_RANK = {
    **{omni_voice_id(v[0]): i for i, v in enumerate(OMNI_VOICES)},
    **{f"kokoro_{v[0]}": i for i, v in enumerate(KOKORO_VOICES)},
    **{f"pocket_{v[0]}": i for i, v in enumerate(POCKET_VOICES)},
}
_PUBLIC_FIELDS = ("voice_id", "name", "category", "model_id", "language", "accent", "description", "labels",
                  "preview_url", "created_at")


def public(voice: dict) -> dict:
    return {k: voice.get(k) for k in _PUBLIC_FIELDS}


def voice_or_404(voice_id: str) -> dict:
    voice = store.voices.get(voice_id)
    if not voice:
        raise APIError(404, "voice_not_found", f"Voice '{voice_id}' was not found.")
    return voice


@router.get("/v1/voices")
def list_voices(search: str = "", category: str = "", model_id: str = "", language: str = ""):
    q = search.lower().strip()

    def matches(v: dict) -> bool:
        if category and v["category"] != category:
            return False
        if model_id and v.get("model_id") != model_id:
            return False
        if language and v.get("language") not in (language, "multi"):
            return False
        if q:
            hay = f"{v['name']} {v.get('description', '')} {v.get('accent', '')} {' '.join(map(str, v.get('labels', {}).values()))}"
            return q in hay.lower()
        return True

    voices = [v for v in store.voices.all() if matches(v)]
    mine = [v for v in voices if v["category"] != "premade"]  # already newest first
    premade = sorted((v for v in voices if v["category"] == "premade"),
                     key=lambda v: (_ORDER.get(v.get("model_id"), 9), _PREMADE_RANK.get(v["voice_id"], 999)))
    return {"voices": [public(v) for v in mine + premade]}


@router.get("/v1/voices/{voice_id}")
def get_voice(voice_id: str):
    return public(voice_or_404(voice_id))


@router.get("/v1/voices/{voice_id}/preview")
def voice_preview(voice_id: str):
    return FileResponse(preview_path(voice_or_404(voice_id)), media_type="audio/wav",
                        headers={"cache-control": "public, max-age=86400"})


class VoicePatch(BaseModel):
    name: str | None = None
    description: str | None = None
    labels: dict[str, str] | None = None


@router.patch("/v1/voices/{voice_id}")
def edit_voice(voice_id: str, patch: VoicePatch):
    if voice_or_404(voice_id)["category"] == "premade":
        raise APIError(400, "cannot_edit_premade", "Premade voices cannot be edited.")
    fields = patch.model_dump(exclude_none=True)
    if "name" in fields and not fields["name"].strip():
        raise APIError(400, "invalid_name", "Voice name cannot be empty.")
    return public(store.voices.update(voice_id, **fields))


@router.delete("/v1/voices/{voice_id}")
def delete_voice(voice_id: str):
    voice = voice_or_404(voice_id)
    if voice["category"] == "premade":
        raise APIError(400, "cannot_delete_premade", "Premade voices cannot be deleted.")
    store.voices.delete(voice_id)
    TTS_ENGINES[voice.get("model_id", "omnivoice")].forget(voice_id)
    shutil.rmtree(VOICES_DIR / voice_id, ignore_errors=True)
    return {"status": "ok"}


def _register(voice_id: str, *, name: str, category: str, model_id: str, description: str, labels: dict) -> dict:
    return store.voices.add({
        "voice_id": voice_id, "name": name, "category": category, "model_id": model_id, "language": "multi",
        "accent": labels.get("accent", ""), "description": description, "labels": labels,
        "preview_url": f"/v1/voices/{voice_id}/preview", "created_at": store.now_iso(),
    })


@router.post("/v1/voices/add")
def add_voice(name: str = Form(...), description: str = Form(""), labels: str = Form("{}"),
              ref_text: str = Form(""), model_id: str = Form("omnivoice"), files: list[UploadFile] = File(...)):
    name = name.strip()
    if not name:
        raise APIError(400, "invalid_name", "Voice name is required.")
    engine = TTS_ENGINES.get(model_id)
    if engine is None or not engine.describe().get("can_clone"):
        raise APIError(400, "clone_unsupported", f"Model '{model_id}' cannot clone voices.")
    try:
        parsed_labels = {str(k): str(v) for k, v in json.loads(labels or "{}").items()}
    except (ValueError, AttributeError):
        raise APIError(400, "invalid_request", "labels must be a JSON object.")

    audio = np.concatenate([stash_upload(f, keep=False, max_seconds=10 * 60)[1] for f in files])
    if len(audio) < SAMPLE_RATE * 2:
        raise APIError(400, "audio_too_short", "Please provide at least 2 seconds of clear speech.")
    # Prompts work best at 3-20 s. Without a transcript, trim first and transcribe what remains.
    limit = MAX_CLONE_SECONDS if ref_text.strip() else 15
    audio = audio[: SAMPLE_RATE * limit]

    voice_id = store.new_id("v")
    folder = VOICES_DIR / voice_id
    folder.mkdir(parents=True)
    try:
        ref_wav = save(audio, SAMPLE_RATE, folder / "reference", "wav")
        text = ref_text.strip() or stt.transcribe(ref_wav, model_id=INTERNAL_STT, words=False)["text"]
        if not text:
            raise APIError(400, "no_speech", "No speech was detected in the sample. Try a clearer recording.")
        engine.clone(voice_id, ref_wav, text)
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise
    voice = _register(voice_id, name=name, category="cloned", model_id=model_id, description=description,
                      labels=parsed_labels)
    return {"voice_id": voice_id, "voice": public(voice)}


# ---------------------------------------------------------------- voice design (OmniVoice)
DESIGN_SAMPLE = "Every voice tells a story. This is how mine sounds when I read something aloud for you."


class DesignRequest(BaseModel):
    voice_description: str
    text: str | None = None


@router.post("/v1/text-to-voice/create-previews")
def design_previews(req: DesignRequest):
    text = ((req.text or "").strip() or DESIGN_SAMPLE)[:400]
    instruct = ", ".join(p.strip().lower() for p in req.voice_description.split(",") if p.strip())
    previews = []
    for _ in range(3):
        gid = store.new_id("g")
        audio = omnivoice.design(instruct or None, text, steps=16)
        path = save(audio, SAMPLE_RATE, PREVIEWS_DIR / gid, "wav")
        (PREVIEWS_DIR / f"{gid}.json").write_text(json.dumps({"text": text, "instruct": instruct}))
        previews.append({"generated_voice_id": gid, "audio_url": url_for(path),
                         "duration_secs": duration(audio, SAMPLE_RATE)})
    return {"previews": previews}


class SaveDesignRequest(BaseModel):
    generated_voice_id: str
    voice_name: str
    voice_description: str = ""


@router.post("/v1/text-to-voice/create-voice-from-preview")
def save_design(req: SaveDesignRequest):
    gid = req.generated_voice_id
    meta_path, wav = PREVIEWS_DIR / f"{gid}.json", PREVIEWS_DIR / f"{gid}.wav"
    if not (gid.startswith("g_") and gid[2:].isalnum() and meta_path.exists() and wav.exists()):
        raise APIError(404, "preview_not_found", "That preview has expired. Generate new previews.")
    meta = json.loads(meta_path.read_text())
    voice_id = store.new_id("v")
    folder = VOICES_DIR / voice_id
    folder.mkdir(parents=True)
    try:
        ref = folder / "reference.wav"
        shutil.copy(wav, ref)
        omnivoice.clone(voice_id, ref, meta["text"])
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise
    labels = {"design": meta["instruct"]} if meta["instruct"] else {}
    return public(_register(voice_id, name=req.voice_name.strip() or "Untitled voice", category="generated",
                            model_id="omnivoice", description=req.voice_description or meta["instruct"],
                            labels=labels))
