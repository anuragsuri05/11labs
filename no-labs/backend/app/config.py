import os
from pathlib import Path

VERSION = "1.0.0"
ROOT = Path(__file__).resolve().parents[2]  # the project folder

DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data")).resolve()
FILES_DIR = DATA_DIR / "files"
VOICES_DIR = FILES_DIR / "voices"
PREVIEWS_DIR = FILES_DIR / "previews"
OUT_DIR = FILES_DIR / "out"
IN_DIR = FILES_DIR / "in"
for d in (VOICES_DIR, PREVIEWS_DIR, OUT_DIR, IN_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Built frontend, served at / when present (npm start). In dev, Vite serves it instead.
WEB_DIR = Path(os.environ.get("WEB_DIR", ROOT / "frontend" / "dist")).resolve()

FFMPEG = os.environ.get("FFMPEG_BINARY", "ffmpeg")


def _auto_device() -> str:
    import torch

    if torch.cuda.is_available():
        return "cuda:0"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _total_memory_gb() -> float:
    """Memory available to this process: the cgroup limit in containers, else physical RAM."""
    for path in ("/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"):
        try:
            raw = Path(path).read_text().strip()
            if raw.isdigit() and int(raw) < 1 << 50:
                return int(raw) / 2**30
        except OSError:
            pass
    try:
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2**30
    except (ValueError, OSError, AttributeError):
        return 8.0


DEVICE = os.environ.get("DEVICE", "auto")
if DEVICE == "auto":
    DEVICE = _auto_device()
CPUS = os.cpu_count() or 4
TORCH_THREADS = int(os.environ.get("TORCH_THREADS", min(8, CPUS)))
# Per-engine thread counts, from benchmarks on an 8-core/16-thread CPU: about one thread per
# physical core is fastest, and stays fast when the browser and other apps share the CPU
# (more threads collapse under contention). Pocket TTS is fastest on very few threads.
_CORES = max(1, CPUS // 2) if CPUS >= 8 else CPUS
THREADS = {
    "omnivoice": int(os.environ.get("NOLABS_THREADS_OMNIVOICE", min(8, _CORES))),
    "kokoro": int(os.environ.get("NOLABS_THREADS_KOKORO", min(8, _CORES))),
    "pocket": int(os.environ.get("NOLABS_THREADS_POCKET", min(2, CPUS))),
    "stt": int(os.environ.get("NOLABS_THREADS_STT", min(8, CPUS))),
}
POCKET_QUANTIZE = os.environ.get("NOLABS_POCKET_QUANTIZE", "1") != "0"
WARMUP = [e.strip() for e in os.environ.get("NOLABS_WARMUP", "kokoro,pocket,stt").split(",") if e.strip()]
INTERNAL_STT = os.environ.get("NOLABS_INTERNAL_STT", "whisper-base")  # transcripts for cloning / voice changer

# Leave ~1.5 GB for Python, the web server and audio buffers.
MEMORY_BUDGET_GB = float(os.environ.get("NOLABS_MEMORY_GB", max(2.0, _total_memory_gb() - 1.5)))
MAX_WAITING_JOBS = int(os.environ.get("NOLABS_MAX_QUEUE", "8"))
MAX_UPLOAD_MB = int(os.environ.get("NOLABS_MAX_UPLOAD_MB", "200"))
API_KEY = os.environ.get("NOLABS_API_KEY", "").strip() or None
CORS_ORIGINS = [o.strip() for o in os.environ.get("NOLABS_CORS_ORIGINS", "*").split(",") if o.strip()]
PREVIEW_TTL_HOURS = float(os.environ.get("NOLABS_PREVIEW_TTL_HOURS", "24"))
HF_TOKEN = os.environ.get("HF_TOKEN") or None

OMNIVOICE_MODEL = os.environ.get("TTS_MODEL", "k2-fsa/OmniVoice")
KOKORO_MODEL = os.environ.get("KOKORO_MODEL", "hexgrad/Kokoro-82M")
SFX_MODEL = os.environ.get("SFX_MODEL", "cvssp/audioldm-s-full-v2")
MUSIC_MODEL = os.environ.get("MUSIC_MODEL", "facebook/musicgen-small")

MAX_TTS_CHARS = 5000
SAMPLE_RATE = 24000  # all three TTS engines output 24 kHz

# Input limits (seconds of audio)
MAX_STT_SECONDS = 2 * 3600
MAX_CHANGER_SECONDS = 5 * 60
MAX_ISOLATION_SECONDS = 15 * 60
MAX_CLONE_SECONDS = 60
