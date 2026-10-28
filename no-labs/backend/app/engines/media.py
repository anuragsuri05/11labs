"""Speech-to-text (faster-whisper), voice isolation (Demucs), sound effects (AudioLDM), music (MusicGen)."""

from pathlib import Path

import numpy as np
import torch

from ..audio import decode
from ..config import DEVICE, MUSIC_MODEL, SFX_MODEL, THREADS
from ..errors import APIError
from . import Engine

STT_MODELS = {
    "whisper-base": ("base", "Whisper Base", "Fastest, good for clear speech.", 0.3),
    "whisper-small": ("small", "Whisper Small", "Balanced speed and accuracy.", 0.6),
    "whisper-medium": ("medium", "Whisper Medium", "More accurate, slower.", 1.6),
    "whisper-large-v3-turbo": ("large-v3-turbo", "Whisper Large v3 Turbo", "Most accurate, slowest on CPU.", 1.8),
}
DEFAULT_STT = "whisper-small"


class STTEngine(Engine):
    name = "stt"
    threads = THREADS["stt"]

    def __init__(self):
        super().__init__()
        self._models: dict[str, object] = {}

    @property
    def size_gb(self) -> float:
        return sum(STT_MODELS[m][3] for m in self._models) or 0.6

    def _load(self):
        return self._models  # individual Whisper sizes load on demand

    def _on_unload(self):
        self._models.clear()

    @staticmethod
    def list_models() -> list[dict]:
        return [{"model_id": k, "name": v[1], "description": v[2], "default": k == DEFAULT_STT}
                for k, v in STT_MODELS.items()]

    def _get(self, model_id: str):
        if model_id not in STT_MODELS:
            raise APIError(400, "invalid_request", f"Unknown speech-to-text model '{model_id}'. "
                           f"Use one of: {', '.join(STT_MODELS)}.")
        models = self.model
        if model_id not in models:
            from faster_whisper import WhisperModel

            cuda = DEVICE.startswith("cuda")
            try:
                models[model_id] = WhisperModel(STT_MODELS[model_id][0], device="cuda" if cuda else "cpu",
                                                compute_type="float16" if cuda else "int8",
                                                cpu_threads=THREADS["stt"])
            except Exception as e:
                raise APIError(503, "engine_unavailable", f"Could not load {model_id}: {e}") from e
        return models[model_id]

    def transcribe(self, path: Path, language: str | None = None, model_id: str = DEFAULT_STT,
                   words: bool = True) -> dict:
        model = self._get(model_id or DEFAULT_STT)
        with self.slot():
            segs, info = model.transcribe(str(path), language=language or None, word_timestamps=words,
                                          vad_filter=True)
            segs = list(segs)
        return {
            "language_code": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(info.duration, 2),
            "text": " ".join(s.text.strip() for s in segs).strip(),
            "segments": [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in segs],
            "words": [{"text": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)}
                      for s in segs for w in (s.words or [])],
        }


class IsolatorEngine(Engine):
    name = "isolator"
    size_gb = 0.5
    sample_rate = 44100

    def _load(self):
        from demucs.pretrained import get_model

        model = get_model("htdemucs")
        model.eval()
        return model

    def isolate(self, path: Path) -> np.ndarray:
        from demucs.apply import apply_model

        model = self.model
        wav = torch.from_numpy(decode(path, self.sample_rate, channels=2).copy())
        ref = wav.mean(0)
        mean, std = ref.mean(), ref.std() + 1e-8
        with self.slot(), torch.no_grad():
            sources = apply_model(model, ((wav - mean) / std)[None], device=DEVICE.split(":")[0],
                                  split=True, overlap=0.25, progress=False)[0]
        vocals = sources[model.sources.index("vocals")] * std + mean
        return vocals.numpy()


class SFXEngine(Engine):
    name = "sfx"
    size_gb = 1.6
    sample_rate = 16000

    def _load(self):
        from diffusers import AudioLDMPipeline

        return AudioLDMPipeline.from_pretrained(SFX_MODEL).to(DEVICE)

    def generate(self, prompt: str, seconds: float, influence: float) -> np.ndarray:
        pipe = self.model
        with self.slot():
            out = pipe(prompt, negative_prompt="low quality, noise, distortion",
                       num_inference_steps=30, audio_length_in_s=float(seconds),
                       guidance_scale=1.5 + 4.5 * float(influence)).audios[0]
        return np.asarray(out, dtype=np.float32)


class MusicEngine(Engine):
    name = "music"
    size_gb = 1.6

    def _load(self):
        from transformers import AutoProcessor, MusicgenForConditionalGeneration

        processor = AutoProcessor.from_pretrained(MUSIC_MODEL)
        model = MusicgenForConditionalGeneration.from_pretrained(MUSIC_MODEL).to(DEVICE)
        return processor, model

    @property
    def sample_rate(self) -> int:
        return self.model[1].config.audio_encoder.sampling_rate

    def generate(self, prompt: str, seconds: float) -> np.ndarray:
        processor, model = self.model
        inputs = processor(text=[prompt], padding=True, return_tensors="pt").to(DEVICE)
        with self.slot(), torch.no_grad():
            audio = model.generate(**inputs, do_sample=True, guidance_scale=3.0,
                                   max_new_tokens=int(seconds * 50))
        return audio[0, 0].float().cpu().numpy()


stt = STTEngine()
isolator = IsolatorEngine()
sfx = SFXEngine()
music = MusicEngine()
