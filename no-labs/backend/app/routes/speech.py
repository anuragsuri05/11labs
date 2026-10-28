import json

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .. import store
from ..config import INTERNAL_STT, MAX_CHANGER_SECONDS, MAX_STT_SECONDS, MAX_TTS_CHARS, SAMPLE_RATE
from ..engines.media import DEFAULT_STT, stt
from ..engines.tts import TTS_ENGINES
from ..errors import APIError
from ..media_io import audio_response, stash_upload, url_for
from ..streaming import create_session, primed, take_session, tts_stream
from .voices import voice_or_404

router = APIRouter()


def _engine_for(voice: dict, model_id: str | None):
    voice_model = voice.get("model_id", "omnivoice")
    if model_id and model_id not in TTS_ENGINES:
        raise APIError(400, "invalid_request", f"Unknown model '{model_id}'. Use one of: {', '.join(TTS_ENGINES)}.")
    if model_id and model_id != voice_model:
        raise APIError(400, "voice_model_mismatch",
                       f"Voice '{voice['name']}' belongs to the {voice_model} model, not {model_id}.")
    return TTS_ENGINES[voice_model]


class TTSRequest(BaseModel):
    text: str
    model_id: str | None = None
    language_code: str | None = None
    voice_settings: dict = Field(default_factory=dict)
    output_format: str = "mp3_44100_128"


def _prepare(voice_id: str, req: "TTSRequest"):
    text = req.text.strip()
    if not text:
        raise APIError(400, "empty_text", "Text is empty.")
    if len(text) > MAX_TTS_CHARS:
        raise APIError(400, "text_too_long", f"Text is limited to {MAX_TTS_CHARS} characters per request.")
    voice = voice_or_404(voice_id)
    return text, voice, _engine_for(voice, req.model_id), req.voice_settings or {}


@router.post("/v1/text-to-speech/{voice_id}")
def text_to_speech(voice_id: str, req: TTSRequest):
    text, voice, engine, settings = _prepare(voice_id, req)
    audio = engine.synthesize(voice, text, settings, language=req.language_code or None)
    return audio_response(audio, SAMPLE_RATE, kind="tts", text=text, fmt=req.output_format, voice=voice,
                          settings=settings, model_id=engine.model_id)


def _streaming_response(text, voice, engine, settings, language, item_id) -> StreamingResponse:
    body = primed(tts_stream(engine, voice, text, settings, language, item_id))
    return StreamingResponse(body, media_type="audio/mpeg", headers={
        "history-item-id": item_id, "x-audio-url": f"/files/out/{item_id}.mp3", "x-model-id": engine.model_id,
        "cache-control": "no-store", "x-accel-buffering": "no"})


@router.post("/v1/text-to-speech/{voice_id}/stream")
def text_to_speech_stream(voice_id: str, req: TTSRequest):
    """MP3 streamed sentence by sentence while it is generated (ElevenLabs-compatible path)."""
    text, voice, engine, settings = _prepare(voice_id, req)
    return _streaming_response(text, voice, engine, settings, req.language_code or None, store.new_id("h"))


@router.post("/v1/text-to-speech/{voice_id}/stream-session")
def text_to_speech_stream_session(voice_id: str, req: TTSRequest):
    """For browsers: returns a one-time GET URL that an <audio> element can play while it streams."""
    text, voice, engine, settings = _prepare(voice_id, req)
    item_id = store.new_id("h")
    token = create_session(voice_id=voice["voice_id"], text=text, settings=settings,
                           language=req.language_code or None, item_id=item_id)
    return {"stream_url": f"/v1/streams/{token}", "history_item_id": item_id,
            "audio_url": f"/files/out/{item_id}.mp3", "model_id": engine.model_id}


@router.get("/v1/streams/{token}")
def play_stream(token: str):
    session = take_session(token)
    if not session:
        raise APIError(404, "stream_not_found", "This stream has expired or was already played.")
    voice = voice_or_404(session["voice_id"])
    return _streaming_response(session["text"], voice, _engine_for(voice, None), session["settings"],
                               session["language"], session["item_id"])


@router.post("/v1/speech-to-text")
def speech_to_text(file: UploadFile = File(...), language_code: str = Form(""),
                   model_id: str = Form(DEFAULT_STT), timestamps_granularity: str = Form("word")):
    src, _ = stash_upload(file, 16000, max_seconds=MAX_STT_SECONDS)
    result = stt.transcribe(src, language_code or None, model_id or DEFAULT_STT,
                            words=timestamps_granularity == "word")
    item_id = store.new_id("h")
    store.history.add({
        "history_item_id": item_id, "kind": "stt", "text": result["text"], "voice_id": None,
        "voice_name": None, "model_id": model_id, "audio_url": None, "source_url": url_for(src),
        "duration_secs": result["duration"],
        "settings": {"language_code": result["language_code"], "segments": result["segments"]},
        "created_at": store.now_iso(),
    })
    return {**result, "history_item_id": item_id}


@router.post("/v1/speech-to-speech/{voice_id}")
def speech_to_speech(voice_id: str, audio: UploadFile = File(...), voice_settings: str = Form("{}")):
    voice = voice_or_404(voice_id)
    engine = _engine_for(voice, None)
    try:
        settings = json.loads(voice_settings or "{}")
        assert isinstance(settings, dict)
    except (ValueError, AssertionError):
        raise APIError(400, "invalid_request", "voice_settings must be a JSON object.")
    src, samples = stash_upload(audio, max_seconds=MAX_CHANGER_SECONDS)
    tr = stt.transcribe(src, model_id=INTERNAL_STT, words=False)
    if not tr["segments"]:
        raise APIError(400, "no_speech", "No speech was detected in the source audio.")
    out = engine.synthesize_segments(voice, tr["segments"], len(samples) / SAMPLE_RATE, settings,
                                     language=tr["language_code"])
    return audio_response(out, SAMPLE_RATE, kind="voice_changer", text=tr["text"], voice=voice,
                          settings=settings, source=src, model_id=engine.model_id)
