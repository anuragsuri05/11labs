"""Streaming text to speech: encode audio to MP3 as each sentence is generated.

One ffmpeg process per stream turns float PCM into MP3 frames. The frames go to the client
and into the history file at the same time, so the saved file is exactly what was streamed.
"""

import itertools
import queue
import secrets
import subprocess
import threading
import time
from collections.abc import Iterator

import numpy as np

from . import store
from .config import FFMPEG, OUT_DIR, SAMPLE_RATE
from .media_io import url_for

SESSION_TTL = 600  # seconds a stream URL stays valid
_failed: dict[str, float] = {}  # history ids of streams that stopped before finishing


def stream_failed(item_id: str) -> bool:
    return item_id in _failed


class Mp3StreamEncoder:
    def __init__(self, path, sample_rate: int = SAMPLE_RATE):
        self.path = path
        self.file = open(path, "wb")
        self.proc = subprocess.Popen(
            [FFMPEG, "-nostdin", "-v", "error", "-f", "f32le", "-ar", str(sample_rate), "-ac", "1", "-i", "pipe:0",
             "-ar", "44100", "-b:a", "128k", "-f", "mp3", "-flush_packets", "1", "pipe:1"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        )
        self._out: queue.Queue[bytes | None] = queue.Queue()
        threading.Thread(target=self._read, daemon=True).start()

    def _read(self):
        while data := self.proc.stdout.read1(16384):
            self._out.put(data)
        self._out.put(None)

    def _take(self, wait: float) -> bytes:
        parts = []
        try:
            item = self._out.get(timeout=wait) if wait else self._out.get_nowait()
            while item is not None:
                parts.append(item)
                item = self._out.get_nowait()
            self._out.put(None)  # keep the end marker for finish()
        except queue.Empty:
            pass
        data = b"".join(parts)
        self.file.write(data)
        return data

    def feed(self, samples: np.ndarray) -> bytes:
        """Encode a chunk; returns whatever MP3 bytes are ready (waits briefly for the first frames)."""
        self.proc.stdin.write(np.asarray(samples, dtype=np.float32).tobytes())
        self.proc.stdin.flush()
        return self._take(wait=0.25)

    def finish(self) -> bytes:
        self.proc.stdin.close()
        parts = []
        while (item := self._out.get(timeout=30)) is not None:
            parts.append(item)
        self.proc.wait(timeout=30)
        data = b"".join(parts)
        self.file.write(data)
        self.file.close()
        return data

    def abort(self):
        self.proc.kill()
        self.file.close()
        self.path.unlink(missing_ok=True)


def tts_stream(engine, voice: dict, text: str, settings: dict, language: str | None,
               item_id: str) -> Iterator[bytes]:
    """Yield MP3 bytes as audio is generated, then record the finished clip in history."""
    path = OUT_DIR / f"{item_id}.mp3"
    enc = None
    samples = 0
    done = False
    try:
        for chunk in engine.stream_with_gaps(voice, text, settings, language):
            if enc is None:
                enc = Mp3StreamEncoder(path)
            samples += len(chunk)
            yield enc.feed(chunk)
        if enc is None:
            from .errors import APIError
            raise APIError(400, "invalid_request", "Nothing to say: the text produced no speech.")
        yield enc.finish()
        done = True
        store.history.add({
            "history_item_id": item_id, "kind": "tts", "text": text, "voice_id": voice["voice_id"],
            "voice_name": voice["name"], "model_id": engine.model_id, "audio_url": url_for(path),
            "source_url": None, "duration_secs": round(samples / SAMPLE_RATE, 2), "settings": settings,
            "created_at": store.now_iso(),
        })
    finally:
        if not done:
            if enc is not None:
                enc.abort()  # client went away or generation failed: no partial history item
            now = time.monotonic()
            for k in [k for k, t in _failed.items() if now - t > SESSION_TTL]:
                del _failed[k]
            _failed[item_id] = now


def primed(gen: Iterator[bytes]) -> Iterator[bytes]:
    """Run the first chunk now, so errors (bad voice, model load failure) become proper HTTP errors."""
    first = next(gen)
    return itertools.chain([first], gen)


# ---------------------------------------------------------------- stream sessions (for <audio src>)
_sessions: dict[str, dict] = {}
_lock = threading.Lock()


def create_session(**params) -> str:
    token = secrets.token_urlsafe(16)
    with _lock:
        now = time.monotonic()
        for k in [k for k, v in _sessions.items() if now - v["created"] > SESSION_TTL]:
            del _sessions[k]
        _sessions[token] = {**params, "created": now}
    return token


def take_session(token: str) -> dict | None:
    with _lock:
        session = _sessions.pop(token, None)
    if session and time.monotonic() - session["created"] > SESSION_TTL:
        return None
    return session
