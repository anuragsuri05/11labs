# NO LABS API contract (v2)

Base URL: `http://localhost:3333` (UI and API share one port). Paths and payload shapes mirror ElevenLabs' `/v1` API where practical,
so ElevenLabs-style client code can point here.

**Auth.** Off by default. When the server has `NOLABS_API_KEY` set, every `/v1/*` and `/files/*` request needs either
the `xi-api-key: <key>` header or the `nolabs_session` cookie, except `GET /v1/health` and `POST /v1/auth/login`.
`POST /v1/auth/login` JSON `{"key":"..."}` → `{"status":"ok"}` plus an HttpOnly `nolabs_session` cookie (wrong key → 401).
`POST /v1/auth/logout` clears it. A missing or invalid key returns 401 with `detail.status = "unauthorized"`.

Generated audio files are served at `GET /files/<name>`.
Endpoints that return audio bytes also set these response headers:
`history-item-id`, `x-audio-url` (the `/files/...` url of the saved file), `x-duration-seconds`, `x-model-id`.

Errors: non-2xx with JSON `{"detail": {"status": "<code>", "message": "<human text>"}}`. Notable codes:
- 400 `invalid_request` / `text_too_long` / `voice_model_mismatch` / `invalid_audio` / `audio_too_long`
- 401 `unauthorized`, 404 `voice_not_found`
- 409 `voice_not_ready`, 413 `file_too_large`
- 429 `server_busy` (too many queued jobs; retry later), 503 `engine_unavailable` (model failed to load; message says why)

Inference runs one job at a time. On CPU, OmniVoice takes ~10–60 s per request, while Kokoro and Pocket are about real-time or faster.

## System
- `GET /v1/health` → `{"status":"ok","version":"1.0.0","device":"cpu","auth":false,"queue":{"running":0,"waiting":0,"max_waiting":8},
  "engines":{"omnivoice":"loaded|idle|unavailable","kokoro":...,"pocket":...,"stt":...,"isolator":...,"sfx":...,"music":...}}`
- `GET /v1/models` → TTS models (ElevenLabs-compatible list):
```json
[{"model_id":"omnivoice","name":"OmniVoice","description":"...","speed":"slow|fast|fastest",
  "languages":[{"language_id":"en","name":"English"}],          // omnivoice: one entry "multi" (600+ languages)
  "can_clone":true,"can_design":true,"voice_count":12,"status":"loaded|idle|unavailable",
  "settings":[{"key":"speed","label":"Speed","min":0.7,"max":1.3,"step":0.05,"default":1.0,"left":"Slower","right":"Faster"},
              {"key":"quality","label":"Quality","min":6,"max":32,"step":1,"default":12,"left":"Faster","right":"Better",
               "hint":"More diffusion steps sound better but take longer."}]}]
```
  Models: `omnivoice` (cloning + design, 600+ languages, slow on CPU), `kokoro` (54 preset voices, 8 languages, fast),
  `pocket` (Kyutai Pocket TTS: 27 preset voices, 7 languages, fastest; cloning only when the server has gated weights).
  The UI renders `settings` generically as sliders and sends them as `voice_settings` keys.
- `GET /v1/speech-to-text/models` → `[{"model_id":"whisper-small","name":"Whisper Small","description":"...","default":true}, ...]`
  (whisper-base, whisper-small, whisper-medium, whisper-large-v3-turbo)

## Voices
Voice object:
```json
{"voice_id":"kokoro_af_heart","name":"Heart","category":"premade|cloned|generated",
 "model_id":"kokoro","language":"en","accent":"american",
 "description":"Warm, expressive American female","labels":{"gender":"female","age":"young","accent":"american","use_case":"narration"},
 "preview_url":"/v1/voices/kokoro_af_heart/preview","created_at":"2026-10-10T12:00:00Z"}
```
- Every voice belongs to exactly one `model_id`, so text to speech must use that model.
- `preview_url` may be generated on first request (fast models in about 1–5 s, OmniVoice premades are pre-rendered) and then cached. It works as `<audio src>`.
- `GET /v1/voices?search=&category=&model_id=&language=` → `{"voices":[Voice...]}`. Your voices come first, then premade voices grouped by model.
- `GET /v1/voices/{voice_id}` → Voice
- `GET /v1/voices/{voice_id}/preview` → audio (wav)
- `PATCH /v1/voices/{voice_id}` JSON `{"name"?, "description"?, "labels"?}` → Voice
- `DELETE /v1/voices/{voice_id}` → `{"status":"ok"}`. Premade voices can't be deleted (400).
- `POST /v1/voices/add` (Instant Voice Clone), multipart: `name` (required), `description`, `labels` (JSON string),
  `ref_text` (optional transcript; auto-transcribed if empty), `model_id` (`omnivoice` default, `pocket` if `can_clone`),
  `files` (one or more audio files, any format including webm from MediaRecorder; 3–20 s total is ideal; max 60 s used)
  → `{"voice_id": "...", "voice": Voice}`

## Voice Design (OmniVoice)
- `POST /v1/text-to-voice/create-previews` JSON `{"voice_description":"female, low pitch, british accent","text":"optional sample text"}`
  → `{"previews":[{"generated_voice_id":"g_...","audio_url":"/files/previews/g_....wav","duration_secs":4.2}]}` (3 previews)
  - **Vocabulary:** comma-separated gender (male/female), age (child/teenager/young adult/middle-aged/elderly),
    pitch (very low/low/moderate/high/very high pitch), whisper, and accent (american, british, australian, canadian,
    indian, chinese, japanese, korean, portuguese, russian + " accent").
  - Unknown items → 400 with suggestions.
- `POST /v1/text-to-voice/create-voice-from-preview` JSON `{"generated_voice_id":"g_...","voice_name":"...","voice_description":"..."}` → Voice (category `generated`, model `omnivoice`)

## Text to Speech
- `POST /v1/text-to-speech/{voice_id}` JSON
  `{"text":"...", "model_id":null, "language_code":null, "voice_settings":{...}, "output_format":"mp3_44100_128|wav_24000"}`
  - `model_id` defaults to the voice's model. A different model → 400 `voice_model_mismatch`.
  - `voice_settings` keys come from that model's `settings` (unknown keys are ignored). Max 5000 chars.
  - Returns audio bytes (`audio/mpeg` or `audio/wav`) plus the headers above.
- `POST /v1/text-to-speech/{voice_id}/stream` → `audio/mpeg` streamed sentence by sentence while it generates (chunked, always MP3).
  Headers: `history-item-id`, `x-audio-url`, `x-model-id`. Errors in the first sentence return normal JSON errors.
- `POST /v1/text-to-speech/{voice_id}/stream-session` (same body) → `{"stream_url":"/v1/streams/<token>","history_item_id","audio_url","model_id"}`.
  For browsers: `GET stream_url` is a one-time (10 min) streaming MP3 an `<audio>` element can play progressively.
- `GET /v1/history/{id}` → the item once generation finished. Returns 404 while a stream is still generating, and 410 `generation_failed` if it stopped partway.

## Speech to Text
- `POST /v1/speech-to-text` multipart `file`, `language_code` (optional, ISO-639-1), `model_id` (default `whisper-small`), `timestamps_granularity` (`word|segment`)
  → `{"language_code":"en","language_probability":0.99,"text":"...","duration":12.3,
      "segments":[{"start":0.0,"end":3.2,"text":"..."}], "words":[{"text":"Hello","start":0.0,"end":0.4}], "history_item_id":"h_..."}`
  Max 2 h of audio.

## Voice Changer (speech to speech)
- `POST /v1/speech-to-speech/{voice_id}` multipart `audio`, `voice_settings` (JSON string) → audio bytes. Works with voices of any model.
  It transcribes the source, then re-synthesises it in the target voice. OmniVoice voices also match the original segment timing.
  Max 5 min.

## Voice Isolator
- `POST /v1/audio-isolation` multipart `audio` → audio bytes (vocals only). Max 15 min.

## Sound Effects
- `POST /v1/sound-generation` JSON `{"text":"glass shattering on concrete","duration_seconds":5,"prompt_influence":0.3}` → audio bytes. Duration 1–10 s.

## Music
- `POST /v1/music` JSON `{"prompt":"lofi hip hop beat, mellow piano","music_length_ms":15000}` → audio bytes. Length 5000–30000 ms.

## History
History item:
```json
{"history_item_id":"h_...","kind":"tts|stt|voice_changer|isolation|sfx|music","text":"input text / prompt / transcript",
 "voice_id":"v_...","voice_name":"Aria","model_id":"omnivoice","audio_url":"/files/out/h_....mp3",
 "source_url":"/files/in/....wav or null","duration_secs":3.1,"settings":{},"created_at":"..."}
```
For `stt` items, `settings.segments` holds the transcript segments.
- `GET /v1/history?kind=&limit=50` → `{"history":[Item...]}`, newest first
- `GET /v1/history/{history_item_id}` → History item (see the streaming notes above)
- `DELETE /v1/history/{history_item_id}` → `{"status":"ok"}`

Uploads are limited to `NOLABS_MAX_UPLOAD_MB` (default 200 MB), above which the server returns 413.
