"""Upload handling and audio responses shared by the routes."""

import shutil
import tempfile
from pathlib import Path

import numpy as np
from fastapi import UploadFile
from fastapi.responses import FileResponse

from . import store
from .audio import decode, duration, save
from .config import FILES_DIR, IN_DIR, MAX_UPLOAD_MB, OUT_DIR, SAMPLE_RATE
from .errors import APIError

_CHUNK = 1 << 20


def url_for(path: Path) -> str:
    return "/files/" + path.relative_to(FILES_DIR).as_posix()


def _copy_limited(upload: UploadFile, dst) -> None:
    limit = MAX_UPLOAD_MB * _CHUNK
    total = 0
    while chunk := upload.file.read(_CHUNK):
        total += len(chunk)
        if total > limit:
            raise APIError(413, "file_too_large", f"Files are limited to {MAX_UPLOAD_MB} MB.")
        dst.write(chunk)
    if total == 0:
        raise APIError(400, "invalid_audio", "The uploaded file is empty.")


def stash_upload(upload: UploadFile, sample_rate: int = SAMPLE_RATE, max_seconds: float | None = None,
                 keep: bool = True) -> tuple[Path, np.ndarray]:
    """Decode an upload (any ffmpeg format) to mono and save it as WAV under files/in."""
    suffix = Path(upload.filename or "audio").suffix[:10] or ".bin"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        try:
            _copy_limited(upload, tmp)
        except Exception:
            Path(tmp.name).unlink(missing_ok=True)
            raise
    try:
        audio = decode(Path(tmp.name), sample_rate)
    finally:
        Path(tmp.name).unlink(missing_ok=True)
    if max_seconds and len(audio) > max_seconds * sample_rate:
        raise APIError(400, "audio_too_long", f"Audio is limited to {int(max_seconds // 60)} minutes for this tool.")
    if not keep:
        return Path(), audio
    dst = IN_DIR / f"{store.new_id('in')}.wav"
    save(audio, sample_rate, dst.with_suffix(""), "wav")
    return dst, audio


def audio_response(audio: np.ndarray, sample_rate: int, *, kind: str, text: str, fmt: str = "mp3",
                   voice: dict | None = None, settings: dict | None = None, source: Path | None = None,
                   model_id: str | None = None) -> FileResponse:
    item_id = store.new_id("h")
    path = save(audio, sample_rate, OUT_DIR / item_id, fmt)
    dur = duration(audio, sample_rate)
    store.history.add({
        "history_item_id": item_id, "kind": kind, "text": text,
        "voice_id": voice and voice["voice_id"], "voice_name": voice and voice["name"],
        "model_id": model_id, "audio_url": url_for(path), "source_url": source and url_for(source),
        "duration_secs": dur, "settings": settings or {}, "created_at": store.now_iso(),
    })
    return FileResponse(path, media_type="audio/mpeg" if path.suffix == ".mp3" else "audio/wav",
                        filename=path.name,
                        headers={"history-item-id": item_id, "x-audio-url": url_for(path),
                                 "x-duration-seconds": str(dur), "x-model-id": model_id or ""})
