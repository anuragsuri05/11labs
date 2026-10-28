"""Audio decode/encode helpers built on ffmpeg."""

import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

from .config import FFMPEG


class AudioError(ValueError):
    pass


def decode(path: Path, sample_rate: int, channels: int = 1) -> np.ndarray:
    """Decode any ffmpeg-readable file (webm, mp3, mp4, ...) to float32 samples."""
    proc = subprocess.run(
        [FFMPEG, "-nostdin", "-v", "error", "-i", str(path), "-ac", str(channels),
         "-ar", str(sample_rate), "-f", "f32le", "-"],
        capture_output=True,
    )
    if proc.returncode != 0 or not proc.stdout:
        raise AudioError(f"Could not decode audio: {proc.stderr.decode(errors='ignore')[-300:]}")
    audio = np.frombuffer(proc.stdout, dtype=np.float32)
    return audio.reshape(-1, channels).T if channels > 1 else audio


def to_wav(src: Path, dst: Path, sample_rate: int) -> float:
    """Normalise an upload to mono WAV; returns duration in seconds."""
    audio = decode(src, sample_rate)
    sf.write(dst, audio, sample_rate)
    return len(audio) / sample_rate


def save(audio: np.ndarray, sample_rate: int, dst_stem: Path, fmt: str) -> Path:
    """Write audio (mono, or channels-first) as wav or mp3. Returns the written path."""
    audio = np.asarray(audio, dtype=np.float32)
    if audio.ndim == 2:
        audio = audio.T
    peak = float(np.abs(audio).max()) if audio.size else 0.0
    if peak > 0.99:
        audio = audio / peak * 0.99
    wav = dst_stem.with_suffix(".wav")
    sf.write(wav, audio, sample_rate)
    if not fmt.startswith("mp3"):
        return wav
    mp3 = dst_stem.with_suffix(".mp3")
    subprocess.run(
        [FFMPEG, "-nostdin", "-v", "error", "-y", "-i", str(wav), "-ar", "44100",
         "-b:a", "128k", str(mp3)],
        check=True,
    )
    wav.unlink()
    return mp3


def duration(audio: np.ndarray, sample_rate: int) -> float:
    return round(audio.shape[-1] / sample_rate, 2)
