"""Text-to-speech engines. Each voice belongs to one engine (its `model_id`).

- OmniVoice (k2-fsa, Apache-2.0): zero-shot cloning + voice design, 600+ languages. Slow on CPU.
- Kokoro (hexgrad, Apache-2.0): 82M params, preset voices in 8 languages, ~real-time on CPU.
- Pocket TTS (Kyutai, MIT): 100M params, preset voices in 7 languages, faster than real-time on CPU.
"""

import re
import threading
from collections.abc import Iterator
from pathlib import Path

import numpy as np
import torch

from ..config import (DEVICE, HF_TOKEN, KOKORO_MODEL, OMNIVOICE_MODEL, POCKET_QUANTIZE, SAMPLE_RATE, THREADS,
                      VOICES_DIR)
from ..errors import APIError
from . import Engine

CHUNK_CHARS = 220
FIRST_CHUNK_CHARS = 90  # short first chunk = first audio sooner when streaming
_SENTENCE = re.compile(r"(?<=[.!?。！？;:])\s+|\n+")


def chunk_text(text: str, limit: int = CHUNK_CHARS, first_limit: int | None = None) -> list[str]:
    """Split on sentence boundaries, packing sentences up to `limit` chars.

    `first_limit` keeps the first chunk short, so streamed audio starts sooner.
    """
    chunks, cur = [], ""

    def cap() -> int:
        return first_limit if first_limit and not chunks else limit

    for sent in (s.strip() for s in _SENTENCE.split(text)):
        if not sent:
            continue
        while len(sent) > cap():  # a single overlong sentence: break at a comma or space
            lim = cap()
            if cur:
                chunks.append(cur)
                cur = ""
                continue
            cut = max(sent.rfind(",", 0, lim), sent.rfind(" ", 0, lim))
            cut = cut if cut > lim // 3 else lim
            chunks.append(sent[: cut + 1].strip())
            sent = sent[cut + 1 :].strip()
        if cur and len(cur) + 1 + len(sent) > cap():
            chunks.append(cur)
            cur = sent
        else:
            cur = f"{cur} {sent}".strip()
    if cur:
        chunks.append(cur)
    return chunks


def silence(seconds: float) -> np.ndarray:
    return np.zeros(int(seconds * SAMPLE_RATE), dtype=np.float32)


def join(parts: list[np.ndarray], gap: float = 0.18) -> np.ndarray:
    out = []
    for p in parts:
        out += [np.asarray(p, dtype=np.float32).reshape(-1), silence(gap)]
    return np.concatenate(out[:-1]) if out else silence(0)


def place_segments(clips: list[np.ndarray], segments: list[dict], total: float) -> np.ndarray:
    """Lay clips out on a timeline at their segment start times without overlapping."""
    out = np.zeros(int(total * SAMPLE_RATE) + 1, dtype=np.float32)
    cursor = 0
    for clip, seg in zip(clips, segments):
        start = max(int(seg["start"] * SAMPLE_RATE), cursor)
        if start + len(clip) > len(out):
            out = np.concatenate([out, np.zeros(start + len(clip) - len(out), dtype=np.float32)])
        out[start:start + len(clip)] += clip
        cursor = start + len(clip)
    return out


def _setting(settings: dict, key: str, default, lo, hi):
    try:
        value = float(settings.get(key, default))
    except (TypeError, ValueError):
        return default
    return min(hi, max(lo, value))


class TTSEngine(Engine):
    model_id = ""
    info: dict = {}
    gap = 0.18  # seconds of silence between streamed chunks

    def describe(self) -> dict:
        return {"model_id": self.model_id, **self.info, "status": self.status}

    def stream(self, voice: dict, text: str, settings: dict, language: str | None = None) -> Iterator[np.ndarray]:
        """Yield audio chunk by chunk (sentence-sized), so playback can start early."""
        raise NotImplementedError

    def stream_with_gaps(self, voice, text, settings, language=None) -> Iterator[np.ndarray]:
        first = True
        for chunk in self.stream(voice, text, settings, language):
            chunk = np.asarray(chunk, dtype=np.float32).reshape(-1)
            if not chunk.size:
                continue
            yield chunk if first else np.concatenate([silence(self.gap), chunk])
            first = False

    def synthesize(self, voice: dict, text: str, settings: dict, language: str | None = None) -> np.ndarray:
        parts = list(self.stream_with_gaps(voice, text, settings, language))
        if not parts:
            raise APIError(400, "invalid_request", "Nothing to say: the text produced no speech.")
        return np.concatenate(parts)

    def synthesize_segments(self, voice: dict, segments: list[dict], total: float, settings: dict,
                            language: str | None = None) -> np.ndarray:
        clips = [self.synthesize(voice, s["text"], settings, language) for s in segments]
        return place_segments(clips, segments, total)

    def clone(self, voice_id: str, ref_wav: Path, ref_text: str):
        raise APIError(400, "clone_unsupported", f"{self.info.get('name', self.model_id)} cannot clone voices.")

    def forget(self, voice_id: str):
        pass


# ---------------------------------------------------------------------------------------------
class OmniVoiceEngine(TTSEngine):
    name = model_id = "omnivoice"
    size_gb = 3.0
    threads = THREADS["omnivoice"]
    info = {
        "name": "OmniVoice",
        "description": "Zero-shot voice cloning and voice design in 600+ languages. Highest flexibility, slowest on CPU.",
        "speed": "slow",
        "languages": [{"language_id": "multi", "name": "600+ languages"}],
        "can_clone": True,
        "can_design": True,
        "settings": [
            {"key": "speed", "label": "Speed", "min": 0.7, "max": 1.3, "step": 0.05, "default": 1.0,
             "left": "Slower", "right": "Faster"},
            {"key": "quality", "label": "Quality", "min": 6, "max": 32, "step": 1, "default": 12,
             "left": "Faster", "right": "Better", "hint": "More diffusion steps sound better but take longer."},
        ],
    }

    def __init__(self):
        super().__init__()
        self._prompts: dict[str, object] = {}

    def _load(self):
        from omnivoice import OmniVoice

        from .omni_fast import install

        install()  # padding-free CFG decoding loop (same output, less compute)
        dtype = torch.float16 if DEVICE.startswith("cuda") else torch.float32
        return OmniVoice.from_pretrained(OMNIVOICE_MODEL, device_map=DEVICE, dtype=dtype)

    def _on_unload(self):
        self._prompts.clear()

    @staticmethod
    def _config(steps: float):
        from omnivoice.models.omnivoice import OmniVoiceGenerationConfig

        return OmniVoiceGenerationConfig(num_step=int(steps))

    def _prompt(self, voice: dict):
        voice_id = voice["voice_id"]
        path = VOICES_DIR / voice_id / "prompt.pt"
        if not path.exists():
            raise APIError(409, "voice_not_ready", f"Voice '{voice['name']}' is still being prepared.")
        if voice_id not in self._prompts:
            from omnivoice import VoiceClonePrompt

            self._prompts[voice_id] = VoiceClonePrompt.load(str(path))
        return self._prompts[voice_id]

    def _iter(self, chunks: list[str], *, prompt=None, instruct=None, speed=1.0, steps=12,
              language=None, durations=None, seed=None) -> Iterator[np.ndarray]:
        model = self.model
        with self.slot():
            if seed is not None:
                torch.manual_seed(seed)
            for i, chunk in enumerate(chunks):
                kw = dict(text=chunk, language=language, generation_config=self._config(steps))
                if durations:
                    kw["duration"] = durations[i]
                else:
                    kw["speed"] = speed
                if prompt is not None:
                    kw["voice_clone_prompt"] = prompt
                elif instruct:
                    kw["instruct"] = instruct
                yield np.asarray(model.generate(**kw)[0], dtype=np.float32)

    def stream(self, voice, text, settings, language=None):
        prompt = self._prompt(voice)
        return self._iter(chunk_text(text, first_limit=FIRST_CHUNK_CHARS), prompt=prompt, language=language,
                          speed=_setting(settings, "speed", 1.0, 0.5, 2.0),
                          steps=_setting(settings, "quality", 12, 4, 64))

    def synthesize_segments(self, voice, segments, total, settings, language=None):
        prompt = self._prompt(voice)
        clips = list(self._iter([s["text"] for s in segments], prompt=prompt, language=language,
                                steps=_setting(settings, "quality", 12, 4, 64),
                                durations=[max(0.4, s["end"] - s["start"]) for s in segments]))
        return place_segments(clips, segments, total)

    def design(self, instruct: str | None, text: str, steps: int = 12, seed: int | None = None) -> np.ndarray:
        return join(list(self._iter(chunk_text(text), instruct=instruct, steps=steps, seed=seed)))

    def clone(self, voice_id, ref_wav, ref_text):
        model = self.model
        with self.slot():
            prompt = model.create_voice_clone_prompt(ref_audio=str(ref_wav), ref_text=ref_text)
        prompt.save(str(VOICES_DIR / voice_id / "prompt.pt"))

    def forget(self, voice_id):
        self._prompts.pop(voice_id, None)


# ---------------------------------------------------------------------------------------------
KOKORO_LANGS = {"a": ("en", "English (US)"), "b": ("en", "English (UK)"), "e": ("es", "Spanish"),
                "f": ("fr", "French"), "h": ("hi", "Hindi"), "i": ("it", "Italian"),
                "p": ("pt", "Portuguese (BR)"), "z": ("zh", "Chinese (Mandarin)")}
# Kokoro yields one result per split; splitting at sentence ends gives early first audio.
_KOKORO_SPLIT = r"(?<=[.!?。！？])\s+|\n+"


class KokoroEngine(TTSEngine):
    name = model_id = "kokoro"
    size_gb = 0.7
    threads = THREADS["kokoro"]
    gap = 0.12
    info = {
        "name": "Kokoro",
        "description": "Lightweight 82M model with natural preset voices. Fast, about real-time on CPU.",
        "speed": "fast",
        "languages": [{"language_id": c, "name": n} for c, n in
                      dict.fromkeys(v for v in KOKORO_LANGS.values())],
        "can_clone": False,
        "can_design": False,
        "settings": [
            {"key": "speed", "label": "Speed", "min": 0.5, "max": 2.0, "step": 0.05, "default": 1.0,
             "left": "Slower", "right": "Faster"},
        ],
    }

    def __init__(self):
        super().__init__()
        self._pipelines: dict[str, object] = {}
        self._pipe_lock = threading.Lock()

    def _load(self):
        from kokoro import KModel

        return KModel(repo_id=KOKORO_MODEL).to(DEVICE.split(":")[0] if DEVICE != "mps" else "cpu").eval()

    def _on_unload(self):
        self._pipelines.clear()

    def _pipeline(self, lang: str):
        model = self.model
        with self._pipe_lock:
            if lang not in self._pipelines:
                from kokoro import KPipeline

                self._pipelines[lang] = KPipeline(lang_code=lang, repo_id=KOKORO_MODEL, model=model)
            return self._pipelines[lang]

    def stream(self, voice, text, settings, language=None):
        kv = voice["engine_voice"]
        pipe = self._pipeline(kv[0])
        speed = _setting(settings, "speed", 1.0, 0.5, 2.0)
        with self.slot():
            results = pipe(text, voice=kv, speed=speed, split_pattern=_KOKORO_SPLIT)
            while True:
                with torch.inference_mode():
                    r = next(results, None)
                if r is None:
                    return
                audio = r.audio if hasattr(r, "audio") else r[2]
                if audio is not None:
                    yield np.asarray(audio, dtype=np.float32)


# ---------------------------------------------------------------------------------------------
POCKET_LANGS = {"english": ("en", "English"), "french": ("fr", "French"), "german": ("de", "German"),
                "spanish": ("es", "Spanish"), "italian": ("it", "Italian"), "portuguese": ("pt", "Portuguese"),
                "dutch": ("nl", "Dutch")}


class PocketEngine(TTSEngine):
    # no_grad, not inference_mode: Pocket generates on its own thread and updates state tensors in place
    name = model_id = "pocket"
    threads = THREADS["pocket"]
    gap = 0.15
    info = {
        "name": "Pocket TTS",
        "description": "Kyutai's 100M-parameter model. The fastest option: several times real-time on a regular CPU.",
        "speed": "fastest",
        "languages": [{"language_id": c, "name": n} for c, n in POCKET_LANGS.values()],
        "can_clone": bool(HF_TOKEN),
        "can_design": False,
        "settings": [
            {"key": "temperature", "label": "Expressiveness", "min": 0.1, "max": 1.0, "step": 0.05, "default": 0.3,
             "left": "Stable", "right": "Expressive", "hint": "Higher values add variation but can be less stable."},
        ],
    }

    def __init__(self):
        super().__init__()
        self._states: dict[str, object] = {}
        self._lang_lock = threading.Lock()

    @property
    def size_gb(self) -> float:
        return 0.6 * max(1, len(self._model or {}))

    def _load(self):
        return {}

    def _on_unload(self):
        self._states.clear()

    def _lang_model(self, language: str):
        models = self.model
        with self._lang_lock:
            if language not in models:
                from pocket_tts import TTSModel

                try:
                    models[language] = TTSModel.load_model(language=language, quantize=POCKET_QUANTIZE)
                except Exception as e:
                    raise APIError(503, "engine_unavailable", f"Pocket TTS ({language}) failed to load: {e}") from e
            return models[language]

    def _state(self, voice: dict, model):
        key = voice["voice_id"]
        if key not in self._states:
            source = voice["engine_voice"] if voice["category"] == "premade" else str(VOICES_DIR / key / "reference.wav")
            try:
                with torch.no_grad():
                    self._states[key] = model.get_state_for_audio_prompt(source)
            except ValueError as e:
                raise APIError(400, "clone_unsupported", str(e)) from e
        return self._states[key]

    def stream(self, voice, text, settings, language=None):
        model = self._lang_model(voice.get("engine_language", "english"))
        temp = _setting(settings, "temperature", 0.3, 0.05, 1.5)
        with self.slot():
            state = self._state(voice, model)
            if hasattr(model, "temp"):
                model.temp = temp
            for chunk in chunk_text(text, 240, first_limit=FIRST_CHUNK_CHARS):
                with torch.no_grad():
                    audio = model.generate_audio(state, chunk).float().cpu().numpy()
                yield audio

    def clone(self, voice_id, ref_wav, ref_text):
        if not HF_TOKEN:
            raise APIError(400, "clone_unsupported",
                           "Pocket TTS cloning needs the gated weights: accept the terms at "
                           "huggingface.co/kyutai/pocket-tts and set HF_TOKEN.")
        model = self._lang_model("english")
        with self.slot(), torch.no_grad():
            self._states[voice_id] = model.get_state_for_audio_prompt(str(ref_wav))

    def forget(self, voice_id):
        self._states.pop(voice_id, None)


omnivoice = OmniVoiceEngine()
kokoro = KokoroEngine()
pocket = PocketEngine()
TTS_ENGINES: dict[str, TTSEngine] = {e.model_id: e for e in (omnivoice, kokoro, pocket)}
