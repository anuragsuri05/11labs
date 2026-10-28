"""Test fixtures: an isolated data dir and fake engines (no model downloads, runs in seconds)."""

import io
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

_TMP = tempfile.mkdtemp(prefix="nolabs-test-")
os.environ["DATA_DIR"] = _TMP
os.environ["WEB_DIR"] = str(Path(_TMP) / "no-web")
os.environ.pop("NOLABS_API_KEY", None)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

SR = 24000


def tone(seconds: float = 1.0, freq: float = 220.0, sr: int = SR) -> np.ndarray:
    t = np.arange(int(seconds * sr)) / sr
    return (0.2 * np.sin(2 * np.pi * freq * t)).astype(np.float32)


def wav_bytes(seconds: float = 3.0, sr: int = SR) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, tone(seconds, sr=sr), sr, format="WAV")
    return buf.getvalue()


def webm_bytes(seconds: float = 3.0) -> bytes:
    """What a browser MediaRecorder upload looks like."""
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"sine=frequency=300:duration={seconds}",
         "-c:a", "libopus", "-f", "webm", "-"], capture_output=True, check=True).stdout


class Calls:
    def __init__(self):
        self.log: list[tuple] = []

    def __call__(self, name, *args):
        self.log.append((name, *args))

    def count(self, name):
        return sum(1 for c in self.log if c[0] == name)


@pytest.fixture(scope="session")
def calls():
    return Calls()


@pytest.fixture(scope="session")
def client(calls):
    from fastapi.testclient import TestClient

    from app import premade
    from app.config import VOICES_DIR
    from app.engines import media, tts

    premade.ensure_omni_voices = lambda: None  # don't design voices with a real model

    def fake_stream(self, voice, text, settings, language=None):
        calls("synthesize", self.model_id, voice["voice_id"], text, dict(settings))
        if self.model_id == "omnivoice":
            self._prompt(voice)  # real readiness check
        for sentence in tts.chunk_text(text, 60):
            yield tone(0.3 + min(len(sentence), 200) / 100)

    def fake_clone(self, voice_id, ref_wav, ref_text):
        calls("clone", self.model_id, voice_id, ref_text)
        if self.model_id == "pocket" and not tts.HF_TOKEN:
            from app.errors import APIError
            raise APIError(400, "clone_unsupported", "needs HF_TOKEN")
        (VOICES_DIR / voice_id / "prompt.pt").write_bytes(b"fake")

    for cls in (tts.OmniVoiceEngine, tts.KokoroEngine, tts.PocketEngine):
        cls.stream = fake_stream
        cls.clone = fake_clone
    tts.OmniVoiceEngine.design = lambda self, instruct, text, steps=12, seed=None: (calls("design", instruct), tone(1.5))[1]

    def fake_transcribe(self, path, language=None, model_id="whisper-small", words=True):
        calls("transcribe", model_id)
        if model_id not in media.STT_MODELS:
            from app.errors import APIError
            raise APIError(400, "invalid_request", "unknown model")
        return {"language_code": "en", "language_probability": 0.99, "duration": 3.0,
                "text": "hello there world",
                "segments": [{"start": 0.2, "end": 1.0, "text": "hello there"},
                             {"start": 1.2, "end": 2.0, "text": "world"}],
                "words": [{"text": "hello", "start": 0.2, "end": 0.5}] if words else []}

    media.STTEngine.transcribe = fake_transcribe
    media.IsolatorEngine.isolate = lambda self, path: (calls("isolate"), np.stack([tone(2, sr=44100)] * 2))[1]
    media.SFXEngine.generate = lambda self, prompt, seconds, influence: (calls("sfx", seconds), tone(seconds, sr=16000))[1]
    media.MusicEngine.sample_rate = 32000
    media.MusicEngine.generate = lambda self, prompt, seconds: (calls("music", seconds), tone(seconds, sr=32000))[1]

    from app.main import app

    with TestClient(app) as c:
        yield c
