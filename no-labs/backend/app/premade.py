"""Voice library setup and voice previews.

Kokoro/Pocket preset voices are registered instantly; their previews render on first play.
OmniVoice premade voices are designed once in the background, and each is then fixed to
its reference clip. That keeps a voice identical across chunks and requests (plain voice
design re-samples a new speaker every call).
"""

import logging
import threading
from pathlib import Path

from . import store
from .audio import save
from .catalog import OMNI_SAMPLE_TEXT, OMNI_VOICES, PREVIEW_TEXT, catalog_voices, omni_voice_id
from .config import INTERNAL_STT, SAMPLE_RATE, VOICES_DIR, WARMUP
from .errors import APIError

log = logging.getLogger("nolabs")
_preview_locks: dict[str, threading.Lock] = {}
_preview_guard = threading.Lock()


def _migrate(voice: dict):
    """Bring voices created by older versions up to the v2 schema."""
    voice.setdefault("model_id", "omnivoice")
    if voice["model_id"] == "omnivoice":
        voice.setdefault("language", "multi")
        voice.setdefault("accent", voice.get("labels", {}).get("accent", ""))
    voice["preview_url"] = f"/v1/voices/{voice['voice_id']}/preview"


def sync_library():
    store.voices.sync(catalog_voices(store.now_iso()), migrate=_migrate)


def ensure_omni_voices():
    from .engines.tts import omnivoice

    for seed, (name, instruct, desc, labels) in enumerate(OMNI_VOICES):
        voice_id = omni_voice_id(name)
        if store.voices.get(voice_id) and (VOICES_DIR / voice_id / "prompt.pt").exists():
            continue
        try:
            folder = VOICES_DIR / voice_id
            folder.mkdir(parents=True, exist_ok=True)
            audio = omnivoice.design(instruct, OMNI_SAMPLE_TEXT, steps=24, seed=1000 + seed)
            wav = save(audio, SAMPLE_RATE, folder / "preview", "wav")
            omnivoice.clone(voice_id, wav, OMNI_SAMPLE_TEXT)
            store.voices.sync([{
                "voice_id": voice_id, "name": name, "category": "premade", "model_id": "omnivoice",
                "language": "multi", "accent": labels.get("accent", ""), "description": desc, "labels": labels,
                "preview_url": f"/v1/voices/{voice_id}/preview", "created_at": store.now_iso(),
            }])
            log.info("premade voice ready: %s", name)
        except Exception:
            log.exception("could not create premade voice %s", name)


def warm_up():
    """Load the fast engines and run a tiny job on each, so the first real request is quick."""
    from .engines.media import stt
    from .engines.tts import TTS_ENGINES

    for name in WARMUP:
        try:
            if name == "stt":
                stt._get(INTERNAL_STT)
            elif name in ("kokoro", "pocket"):
                voice = store.voices.get("kokoro_af_heart" if name == "kokoro" else "pocket_alba")
                if voice:
                    TTS_ENGINES[name].synthesize(voice, "Ready.", {})
            log.info("warmed up %s", name)
        except Exception:
            log.exception("warm-up failed for %s", name)


def _background():
    warm_up()
    ensure_omni_voices()


def start_background_setup():
    sync_library()
    threading.Thread(target=_background, name="startup", daemon=True).start()


def preview_path(voice: dict) -> Path:
    """Path to a voice's preview clip, rendering and caching it on first use."""
    folder = VOICES_DIR / voice["voice_id"]
    for name in ("preview.wav", "reference.wav"):
        if (folder / name).exists():
            return folder / name
    if voice["category"] != "premade" or voice["model_id"] == "omnivoice":
        raise APIError(409, "voice_not_ready", f"Voice '{voice['name']}' is still being prepared.")

    with _preview_guard:
        lock = _preview_locks.setdefault(voice["voice_id"], threading.Lock())
    with lock:
        target = folder / "preview.wav"
        if target.exists():
            return target
        from .engines.tts import TTS_ENGINES

        folder.mkdir(parents=True, exist_ok=True)
        text = PREVIEW_TEXT.get(voice.get("language", "en"), PREVIEW_TEXT["en"])
        audio = TTS_ENGINES[voice["model_id"]].synthesize(voice, text, {})
        tmp = save(audio, SAMPLE_RATE, folder / "preview_rendering", "wav")
        tmp.replace(target)
        return target
