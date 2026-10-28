# NO LABS

A free, self-hosted, open-source voice AI studio with an ElevenLabs-style workflow.
Everything runs on your own machine. There are no accounts, credits or usage limits; speed depends on your hardware.

## Voice models

Pick a model in Text to Speech. Each voice belongs to one model.

| Model | Voices | Languages | Cloning / design | Speed on a CPU | License |
|---|---|---|---|---|---|
| [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) (82M) | 49 presets | English (US/UK), Spanish, French, Hindi, Italian, Portuguese, Mandarin | – | ~real-time | Apache-2.0 |
| [Pocket TTS](https://github.com/kyutai-labs/pocket-tts) (Kyutai, 100M) | 27 presets | English, French, German, Spanish, Italian, Portuguese, Dutch | cloning with `HF_TOKEN`* | ~2× real-time | MIT |
| [OmniVoice](https://github.com/k2-fsa/OmniVoice) (k2-fsa) | 14 designed + yours | 600+ | Instant clone + Voice Design | 5–10× slower than real-time | Apache-2.0 |

\*Pocket TTS cloning needs its gated weights: accept the terms at huggingface.co/kyutai/pocket-tts and set `HF_TOKEN`.

The premade library (~90 voices) covers the same range of styles as ElevenLabs' default library: narrators, audiobook, conversational, news, advertisement, characters, ASMR, many accents and 10+ languages.
These voices come from the open-source models themselves. They are not copies of ElevenLabs' voices.

## Other tools

| Feature | Open-source engine | License |
|---|---|---|
| Speech to Text (word timestamps, SRT export) | faster-whisper (base / small / medium / large-v3-turbo) | MIT |
| Voice Changer | Whisper transcript, then re-voiced in any voice (OmniVoice voices keep the original timing) | — |
| Voice Isolator | Demucs `htdemucs` | MIT |
| Sound Effects | AudioLDM (`cvssp/audioldm-s-full-v2`) | CC-BY-NC-SA 4.0 (non-commercial) |
| Music | MusicGen small (`facebook/musicgen-small`) | CC-BY-NC 4.0 (non-commercial) |

## Run it

```bash
npm i        # one time: installs everything (Python AI engines included)
npm start    # opens http://localhost:3333
```

That's all. `npm run dev` runs the same app with hot reload at http://localhost:5333.
`npm run stop` stops a Docker-mode backend left running in the background.

**What `npm i` does** (see [scripts/nolabs.mjs](scripts/nolabs.mjs)):
- **Apple Silicon Macs, Linux, Windows:** creates `backend/.venv` and installs PyTorch plus the engines there.
  It uses [uv](https://docs.astral.sh/uv/) if installed (it fetches Python by itself); otherwise it needs Python 3.10–3.13.
  NVIDIA GPUs are detected automatically, and Apple GPUs use MPS.
- **Intel Macs:** PyTorch no longer ships builds for them, so the engines run in a Docker container
  instead (requires [Docker Desktop](https://www.docker.com/products/docker-desktop/); it is started for you).
  Force either mode with `NOLABS_RUNTIME=native` or `NOLABS_RUNTIME=docker`.

**Everything stays in this folder:**

| Path | Contents |
|---|---|
| `data/` | your voices, history and generated audio |
| `models/` | AI model weights (~7 GB, downloaded on first use) |
| `backend/.venv/` | Python environment (native mode) |

The first `npm start` downloads models and generates the 9 premade voices (~8 minutes on CPU).
Ports: set `PORT` (default 3333) and `DEV_PORT` (default 5333).

## Speed (Intel i9-9880H laptop CPU, in Docker)

Text to Speech **streams**: playback starts after the first sentence while the rest keeps generating.

| Task | First audio | Whole clip |
|---|---|---|
| TTS, Pocket TTS, a paragraph | ~1.5 s | ~2–5 s |
| TTS, Kokoro, a paragraph | ~1 s | ~5–8 s |
| TTS, OmniVoice, a paragraph (~15 s audio) | ~20 s | ~60–70 s |
| Voice design (3 previews) | | ~45 s |
| Instant clone | | ~25 s |
| Speech to Text, 1 min of audio | | ~10–20 s |
| Voice isolation, 5 s | | ~10–20 s |
| Sound effect, 4 s | | ~20–45 s |
| Music, 6 s | | ~40–70 s |

**How it's tuned:**
- **Pocket TTS** runs int8-quantized on 2 threads, which is 2.6× faster than the default.
- **OmniVoice** uses a padding-free guidance loop (same output, ~17% less compute), one thread per physical core (more threads slow down when other apps are busy), and Quality 12 by default.
- **Fast models** (Kokoro, Pocket, Whisper base) load at startup, so the first request doesn't wait.

**Make it even faster:**
- **Use Kokoro or Pocket TTS** for everyday speech. Keep OmniVoice for cloning, voice design and rare languages.
- **Close heavy apps while generating.** Everything runs on the CPU, so a busy browser or editor slows generation down.
- **Give Docker more memory** (Docker Desktop → Settings → Resources, e.g. 12 GB). With ~8 GB, switching between tools unloads and reloads models, which costs 5–30 s each time.
- **Lower the OmniVoice Quality slider** (diffusion steps) for faster drafts.

### GPU (10–50× faster)
On a Linux or Windows PC with an NVIDIA card, `npm i` installs CUDA PyTorch automatically, and the GPU is used without any setup.
Apple Silicon Macs use the Apple GPU (MPS). A rented GPU box (RunPod, Vast.ai, Lambda) works the same way: `npm i && npm start`.

## Production use

Every setting is an environment variable, passed to `npm start` or set in the shell:

| Variable | Default | Purpose |
|---|---|---|
| `NOLABS_API_KEY` | unset (no auth) | Require an access key. The UI asks for it once (cookie session), and API clients send `xi-api-key: <key>`. **Set this before exposing the server beyond localhost.** |
| `PORT` / `DEV_PORT` | 3333 / 5333 | Ports for `npm start` / `npm run dev` |
| `DEVICE` | `auto` | `cpu`, `cuda:0` or `mps` |
| `TORCH_THREADS` | min(8, cores) | CPU threads for engines without their own setting |
| `NOLABS_THREADS_OMNIVOICE` / `_KOKORO` / `_POCKET` / `_STT` | 8 / 8 / 2 / 8 (capped at physical cores) | Per-engine CPU threads (benchmarked; more is not always faster) |
| `NOLABS_POCKET_QUANTIZE` | 1 | int8 Pocket TTS (set 0 to disable) |
| `NOLABS_WARMUP` | `kokoro,pocket,stt` | Engines loaded at startup (add `omnivoice` if you have the RAM) |
| `NOLABS_INTERNAL_STT` | `whisper-base` | Whisper model used for clone transcripts and the Voice Changer |
| `NOLABS_MEMORY_GB` | detected RAM − 1.5 GB | Model memory budget. Least-recently-used models are unloaded to stay within it |
| `NOLABS_MAX_QUEUE` | 8 | Jobs that may wait while one runs. More return HTTP 429 |
| `NOLABS_MAX_UPLOAD_MB` | 200 | Upload size limit (HTTP 413 above it) |
| `NOLABS_CORS_ORIGINS` | `*` | Comma-separated allowed origins for browser API access from other sites |
| `NOLABS_PREVIEW_TTL_HOURS` | 24 | Unsaved voice-design previews and stray uploads are deleted after this |
| `HF_TOKEN` | unset | Hugging Face token (enables Pocket TTS cloning) |
| `TTS_MODEL`, `KOKORO_MODEL`, `SFX_MODEL`, `MUSIC_MODEL` | — | Override model repos |

What's built in:
- **Requests:** inference runs one job at a time with a bounded queue. Inputs are validated with clear JSON errors (`{"detail":{"status","message"}}`). Uploads have size and duration limits.
- **Models:** they load on demand and unload under a memory budget. A failed model load returns 503 with the reason.
- **Operations:** a Docker health check, request logging, hourly cleanup, and pinned dependency versions (`backend/requirements.txt`).
- **Behind a reverse proxy** (nginx, Caddy): proxy everything to `PORT`, allow long timeouts (≥ 10 min) and large bodies (≥ 200 MB), and use HTTPS when auth is on.

## Testing

```bash
npm test           # backend API tests (fake engines, ~10 s) + frontend type-check/build
npm run test:e2e   # live test of a running server with the real models (E2E_QUICK=1 skips the slow ones)
npm run test:ui    # Playwright browser tests against a running server (uses your installed Google Chrome)
```

## ElevenLabs-compatible API
Paths and payloads follow ElevenLabs' `/v1` API (`/v1/text-to-speech/{voice_id}`, `/v1/voices/add`,
`/v1/speech-to-text`, `/v1/sound-generation`, `/v1/audio-isolation`, `/v1/speech-to-speech/{voice_id}`, ...).
Simple ElevenLabs client code can point at `http://localhost:3333`. Voice IDs and model names differ.

```bash
curl -X POST http://localhost:3333/v1/text-to-speech/premade_aria \
  -H 'content-type: application/json' \
  -d '{"text":"Hello from NO LABS!"}' -o hello.mp3
```

## Limitations
- **Not real-time:** on CPU, audio is returned once it is fully generated.
- **Voice Changer** re-synthesises what was said in the target voice. It keeps the words (and, with OmniVoice voices, the timing), but not the exact intonation, laughs or non-speech sounds.
- **Voice Design** accepts OmniVoice's vocabulary: gender, age, pitch, `whisper`, and accents (american, british, australian, canadian, indian, chinese, japanese, korean, portuguese, russian).
- **Not built yet:** Dubbing, Studio (long-form projects) and the Agents platform.
- **Single-user, no authentication.** Do not expose it to the internet as is.
- **Consent:** only clone voices you have the right and consent to use.
