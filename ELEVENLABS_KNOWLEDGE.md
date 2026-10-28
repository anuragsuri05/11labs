# ElevenLabs — End-to-End Knowledge Base

Compiled 2026-10-10 from official ElevenLabs docs, the help center, the pricing pages, the changelog and the live OpenAPI spec.
Each part ends with an "Unverified / conflicting" section and a list of sources. Prices and models change quickly, so check those against elevenlabs.io before relying on them.

## Contents
- **Part 1 — Text to Speech, Studio, Dubbing, Productions**: models (v4, v4 Turbo, v3, Multilingual v2, Flash), voice settings, audio tags, output formats, Studio 4.0, Dubbing
- **Part 2 — Voices, Voice Changer, Isolator, SFX, Music, Image & Video**: My Voices, Voice Library, Voice Design, IVC/PVC, Iconic Marketplace, Forced Alignment, Audio Native
- **Part 3 — ElevenAgents (Agents Platform / Conversational AI)**: editor tabs, LLMs, tools, MCP, workflows, knowledge base, telephony, widget, SDKs, webhooks, pricing
- **Part 4 — Speech to Text, API, Pricing, Account/Workspace, Other apps**: Scribe, endpoint list, auth, rate limits, plans, settings, ElevenReader, mobile apps

---

# PART 1
## ElevenLabs: Text to Speech, Studio, Dubbing and Productions (research as of 2026-10-10)

> Method: official ElevenLabs docs (elevenlabs.io/docs), pricing pages, blog and changelog, fetched 2026-10-10, plus a few third-party sources where marked. ElevenLabs now splits its brand into **ElevenCreative** (web app: TTS, Studio, Dubbing, etc.), **ElevenAgents** (conversational agents) and **ElevenAPI** (developer platform). Items marked **[unverified]** could not be confirmed from official sources. Items marked **[conflict]** have contradicting official statements.

---

### 1. Headline changes (Jul to Oct 2026)

| Date | Change |
|---|---|
| 2026-09-28 | **Eleven v4** and **Eleven v4 Turbo** launched (90+ languages, ~100 ms median inference for Turbo, PVC support, better tag adherence and IPA support). Available in ElevenCreative, ElevenAgents and ElevenAPI, free tier included. |
| 2026-09-28 | Text to Dialogue gains request stitching (previous/next text and request IDs), `use_pvc_as_ivc`, and a `similarity` setting (0 to 1, default 0.75). `use_pvc_as_ivc` on TTS un-deprecated. Models endpoint: `max_characters_request_free_user` / `_subscribed_user` deprecated in favor of `maximum_text_length_per_request`. |
| 2026-10-05 | ElevenAgents default TTS changed from `eleven_flash_v2` to `eleven_v4_turbo`. |
| 2026-09-21 | TTS streaming emits `is_final_audio_for_turn` after every buffered byte (MP3/Opus too). |
| 2026-08-31 | Studio: `quality_preset` on Create project / Create podcast accepts `null`; `standard` default removed (defaults to highest tier allowed). |
| 2026-08-10 | **Dubbing v2 API** released (90+ languages, editable JSON transcripts/translations, bulk segment update). |
| 2026 (undated) | Studio 4.0: prompt-first workspace with **Studio Agent**, new Video project editor. Dubbing Studio (v1) placed in **maintenance mode** (critical fixes only). |
| Promo | v4 API price shown at 72% off until Oct 12, 2026; "3x credits on Creator+ until October 12" per v4 blog. OpenRouter lists a 50% launch discount through Oct 19 (third-party). |

---

### 2. Text to Speech models

#### 2.1 Current model table (from docs "Models" page)

| Display name | `model_id` | Latency (model inference, excl. network) | Languages | Max chars / request | Notes |
|---|---|---|---|---|---|
| **Eleven v4** | `eleven_v4` | not stated | 90+ | 10,000 (~10 min) | Flagship, most emotive; audio tags; multi-speaker dialogue (Text to Dialogue); IVC from 10 s audio; PVC supported; no SSML break/phoneme tags; IPA in slashes supported |
| **Eleven v4 Turbo** | `eleven_v4_turbo` | ~100 ms median inference; ~150 ms median time-to-first-speech over WebSocket (blog) | 90+ | not stated | Real-time; audio tags; via Text to Dialogue WebSocket; default in ElevenAgents |
| **Eleven v3** | `eleven_v3` | not stated | 70+ | 5,000 (~5 min) | Expressive/dramatic, audio tags, multi-speaker dialogue; PVCs "not fully optimized" |
| **Eleven v3 Conversational** | `eleven_v3_conversational` | ~280 ms | 70+ | not stated | Realtime v3 with tags |
| **Eleven Multilingual v2** | `eleven_multilingual_v2` | not stated (higher than Flash) | 29 | 10,000 (~10 min) | Most stable for long-form; default API model and default Studio model |
| **Eleven Flash v2.5** | `eleven_flash_v2_5` | ~75 ms | 32 | 40,000 (~40 min) | Fastest/cheapest multilingual; text normalization **off by default** |
| **Eleven Flash v2** | `eleven_flash_v2` | ~75 ms | English only | 30,000 (~30 min) | Supports SSML phoneme tags |
| Turbo v2.5 | `eleven_turbo_v2_5` | — | 32 | — | **Deprecated** → use Flash v2.5 ("same behavior, lower latency") |
| Turbo v2 | `eleven_turbo_v2` | — | en | — | **Deprecated** → use Flash v2 |
| Multilingual v1 / English v1 | `eleven_multilingual_v1`, `eleven_monolingual_v1` | — | — | — | Legacy; still listed in the character-limit table |

Related (non-TTS) models: `eleven_ttv_v3` (Voice Design, 70+ langs), `eleven_multilingual_ttv_v2`, `eleven_multilingual_sts_v2` / `eleven_english_sts_v2` (Voice Changer), `eleven_text_to_sound_v2` (SFX), `scribe_v2`, `scribe_v2_realtime`, `scribe_v2_medical`, `music_v1` / `music_v2` / `music_v2_5`.

#### 2.2 Languages

- **v4 / v4 Turbo (90+):** Afrikaans, Amharic, Arabic, Armenian, Assamese, Asturian, Azerbaijani, Belarusian, Bengali, Bosnian, Bulgarian, Burmese, Cantonese, Catalan, Cebuano, Croatian, Czech, Danish, Dutch, English, Estonian, Filipino, Finnish, French, Fula/Pulaar, Galician, Georgian, German, Greek, Gujarati, Hausa, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Javanese, Kamba, Kannada, Kazakh, Korean, Kyrgyz, Lao, Latvian, Lingala, Lithuanian, Luganda, Luxembourgish, Macedonian, Malay, Malayalam, Maltese, Mandarin, Māori, Marathi, Mongolian, Nepali, Norwegian Bokmål, Occitan, Odia, Pashto, Persian, Polish, Portuguese (BR), Punjabi, Romanian, Russian, Serbian, Shona, Sindhi, Slovak, Slovenian, Somali, Sorani Kurdish, Spanish (LatAm), Swahili, Swedish, Tajik, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese, Welsh, Wolof, Zulu.
- **v3 family (70+):** similar list incl. Chichewa, Irish, Kirghiz; excludes several v4 additions (e.g., Amharic, Cantonese, Lao, Maltese, Māori, Mongolian, Wolof, Zulu).
- **Multilingual v2 (29):** en (US/UK/AU/CA), ja, zh, de, hi, fr (FR/CA), ko, pt (BR/PT), it, es (ES/MX), id, nl, tr, fil, pl, sv, bg, ro, ar (SA/UAE), cs, el, fi, hr, ms, sk, da, ta, uk, ru.
- **Flash v2.5 (32):** the 29 above + Hungarian, Norwegian, Vietnamese.
- Pricing page states "74 languages" for paid plans [conflict with 90+ for v4; likely stale copy].

#### 2.3 Pricing per character

**API (billed in USD, not credits — elevenlabs.io/pricing/api):**

| Model | Price per 1K chars |
|---|---|
| v4 | $0.022 promo (list $0.08; "72% off until Oct 12") |
| v4 Turbo | $0.011 promo (list $0.04) |
| v3 | $0.08 |
| v3 Conversational | $0.04 |
| Multilingual v2 | $0.08 |
| Flash / Turbo (v2, v2.5) | $0.04 |

- API plan character allotments (v4 table): Free 10,000; Starter 273,000; Creator 1,000,000; Pro 4,500,000; Scale 13,591,000; Business 45,000,000. [Row-to-plan mapping inferred from order.]
- Docs: Flash v2.5 is "50% lower price per character for API generations".
- Third-party OpenRouter: v4 $40/M chars, v4 Turbo $20/M chars [third-party].

**Web app (credits — elevenlabs.io/pricing FAQ):**
- Text to Speech: **1 credit per character** (Multilingual v2, v3, v4 [v4/v3 rate assumed 1:1, unverified explicitly]).
- Flash/Turbo v2 (English) and v2.5 (multilingual): **0.5 to 1 credit per character** "depending on the model" (commonly cited as 0.5).

**Subscription plans (monthly):**

| Plan | Price | Credits/mo | Approx TTS minutes / extra min | Concurrency | Studio projects | Audio quality |
|---|---|---|---|---|---|---|
| Free | $0 | 10k | ~10 / — | 2 (Multilingual) / 4 (Flash) | 3 (Studio docs say 5) [conflict] | 128 kbps |
| Starter | $6 (promo first month shown) | 30k | ~30 / ~$0.20 | 3 / 6 | 20 | 128 kbps; commercial license; IVC |
| Creator | $22 (promo $11 first month) | 121k | ~121 / ~$0.18 | 5 / 10 | 1,000 | 128 & 192 kbps; 1 PVC |
| Pro | $99 | 600k | ~600 / ~$0.17 | 10 / 20 | 3,000 | + 44.1 kHz PCM via API, WAV |
| Scale | $299 | 1.8M | ~1,800 | 15 / 30 | 20,000 | 3 seats |
| Business | $990 | 6M | ~6,000 | 15–25 / 30 | 20,000 | 10 seats; low-latency TTS from ~5¢/min |
| Enterprise | Custom | Custom | — | Elevated | — | Productions managed dubbing |

- Credits roll over up to 2 months (cap 2× monthly quota), not on Free. Annual = 10× monthly price.
- Text to Dialogue WebSocket concurrency pool: Free 14, Starter 21, Creator 35, Pro 70, Scale/Business 105. Idle connections close after 20 s without `keep_alive`.

---

### 3. Text to Speech web app (ElevenCreative > Text to Speech)

Docs describe only part of the UI; the following is what is documented.

#### 3.1 Layout and controls
- **Left sidebar navigation:** includes **Text to Speech** and **Voice Changer** (plus other products: Studio, Dubbing, Voices, Sound Effects, Music, etc.).
- **Text input box** (center): type/paste text; character counter vs model limit [counter display not explicitly documented].
- **Voice selector:** bottom-left of the editor area ("Your Voices"); opens the voice picker (My Voices, Voice Library, Default voices).
- **Model selector:** lists Eleven v4, Eleven v4 Turbo, Eleven v3, Eleven v3 Conversational, Eleven Multilingual v2, Eleven Flash v2.5 with char limits and language counts.
- **Settings panel (right side, "Settings" tab):** voice sliders/toggles (see 3.2).
- **History tab** (right panel): previous generations; on narrow screens a **history icon** sits above the **Generate speech** button. Each history item has a **download icon** with options **MP3 (128 kbps)** or **WAV**; **Advanced** offers **MP3 (192 kbps)**, **MP3 (256 kbps)**, **M4A**, **FLAC** (higher options plan-gated).
- **Generate speech** button (bottom right). Shows credit cost.
- **Regenerate speech** button: replaces Generate when free regenerations remain (hover shows count). Up to **2 free regenerations** if text, voice, model and settings unchanged, first generation < 2 hours ago, and page not refreshed. Afterwards reverts to "Generate speech" with credit cost.
- **Download button:** bottom right, appears right after generation.
- **Player** with play/pause/scrub after generation [details not documented].
- **Dialogue mode:** on the website when using multiple speakers (v3/v4) — assign voices per speaker line.
- **Language:** auto-detected from text on the website; cannot be forced in the UI (API has `language_code`).
- **Text normalization:** always on in the website.
- **Enhance** (v3 audio-tag auto-insertion button) — reported in v3 launch coverage [unverified in current docs].

#### 3.2 Voice settings

| Setting | UI control | Range / default | Model availability | Notes |
|---|---|---|---|---|
| **Speed** | slider | 0.7–1.2, default 1.0 | Not v3; [conflict] v4 FAQ says not in v4 | Extremes reduce quality |
| **Stability** | slider (v2/Flash); 3-position selector **Creative / Natural / Robust** on v3 | API 0–1, default 0.5; UI common start ~50 | All | Lower = broader emotion, more randomness; v3: Creative = most expressive (may hallucinate), Natural = closest to original recording, Robust = most stable but less responsive to tags (v2-like) |
| **Similarity** (`similarity_boost`) | slider | API default 0.75; UI start ~75 | Not v3; v4 has Stability + Similarity only | High values can reproduce source noise |
| **Style exaggeration** (`style`) | slider | default 0; recommended 0 | Not v4; some models only | Adds latency, reduces stability |
| **Speaker boost** (`use_speaker_boost`) | toggle | default true | Not v3 | Slight latency increase |
| **Reset values** / per-voice defaults | button | — | — | [unverified] |

#### 3.3 Audio tags (v3, v4)
Square-bracket inline directions. Docs: v4 follows tags more reliably; same techniques apply to v3. No SSML `<break>` on v3/v4 — use tags, ellipses, punctuation, CAPS for emphasis.

- **Voice/emotion:** [laughs], [laughs harder], [starts laughing], [wheezing], [whispers], [sighs], [exhales], [sarcastic], [curious], [excited], [crying], [snorts], [mischievously]
- **Emotion families (v4 tag blog):** high energy [excited] [playful] [amazed] [powerful] [proud] [optimistic] [startled]; heated [mad] [aggressive] [bitter] [critical] [repelled]; tense [anxious] [stressed] [scared] [threatened] [vulnerable] [confused] [busy]; low energy [tired] [bored] [distant] [despair] [let down]; calm [peaceful] [content] [curious] [thoughtful] [trusting]
- **Delivery/volume:** [whispers] [shouts] [softly] [quietly] [hushed] [barely audible] [booming] [low, threatening]
- **Pacing:** [slowly] [rushed] [pause] [long pause] [drawn out] [snappy] [speedy]
- **Reactions:** [laughs] [sighs] [gasps] [clears throat] [crying] [gulp] [swallows]
- **Accent/character:** [strong X accent], [British accent], [French accent], [pirate voice], [sings], [woo]
- **Sound effects:** [gunshot] [applause] [clapping] [explosion] [thunder rumbling] [footsteps] [door creaking] [dog barking] [phone buzzing] [light rain]
- **Free-form (v4):** e.g. [like a sports commentator, speeding up], [starting calm, then losing patience], [low, gravelly voice]
- Tips: match tags to voice character; prefer describing voice quality to avoid tags being rendered as SFX; few tags per bracket; dialogue format `Speaker 1: [excitedly] ...`.

#### 3.4 SSML, pronunciation and normalization
- `<break time="1.5s" />` up to **3 s** — Multilingual v2 / Flash only; too many cause instability. Not supported on v3/v4.
- **Phoneme tags** (`<phoneme alphabet="cmu-arpabet|ipa" ph="...">`): docs say only `eleven_flash_v2` [conflict: pronunciation-dictionary guide says phoneme rules work on eleven_v4, eleven_flash_v2, eleven_v3]. CMU Arpabet recommended. Single words only.
- **v4 IPA inline:** wrap IPA in forward slashes in text.
- **Alias** respelling (e.g., "UN" → "United Nations") for models without phoneme support.
- **Pronunciation dictionaries:** `.pls` (W3C lexicon) or `.txt`; alias and phoneme rules only; **case-sensitive**; first match wins; max **3 dictionaries per TTS request** (`pronunciation_dictionary_locators` with `pronunciation_dictionary_id` + optional `version_id`). Versioned. API: `POST /v1/pronunciation-dictionaries/add-from-file`, `add-from-rules`, `add-rules` (replaces same `string_to_replace`), `set-rules` (replace all), remove rules; `workspace_access` admin/editor/commenter/viewer. Used in Studio (Project settings / Pronunciations Editor) and Dubbing Studio. Older upload size limit 1.5 MB [possibly stale].
- **Text normalization:** `apply_text_normalization` = `auto` (default) / `on` / `off` (Studio/podcast also `apply_english`). Flash v2.5 normalization off by default for latency; `apply_language_text_normalization` (Japanese only, adds latency). Larger models handle numbers/dates/URLs better; recommended to pre-normalize text for Flash.

#### 3.5 API endpoints (TTS)
- `POST /v1/text-to-speech/{voice_id}` (convert), `/stream`, `/with-timestamps`, `/stream/with-timestamps` (char-level `alignment` + `normalized_alignment`).
- WebSocket `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input` (+ multi-stream-input for multiple contexts [unverified on page]); regional endpoints US/EU/India/Singapore. Query: `model_id`, `output_format`, `inactivity_timeout` (default 20, max 180), `auto_mode`, `sync_alignment`, `enable_ssml_parsing`, `apply_text_normalization`, `language_code`, `enable_logging`, `seed`. `chunk_length_schedule` default [120,160,250,290] (each 50–500). Messages: InitializeConnection (text " "), SendText (`flush`, `try_trigger_generation`), CloseConnection (""). Server: AudioOutput (base64 + alignment), FinalOutput (`isFinal`).
- **Text to Dialogue** `POST /v1/text-to-dialogue` (+ stream, with-timestamps returning `voice_segments`): v4 (recommended) and v3; unlimited speakers; ≤ **2,000 chars total** per request; settings stability, similarity (0–1, default 0.75), seed; WebSocket for v4 Turbo.

**Body/query parameters (convert):**

| Param | Default | Notes |
|---|---|---|
| `text` | required | |
| `model_id` | `eleven_multilingual_v2` | |
| `voice_settings` | stored voice settings | stability 0.5, similarity_boost 0.75, style 0, use_speaker_boost true, speed 1.0 |
| `language_code` | null | ISO 639-1; not for multilingual_v2 |
| `pronunciation_dictionary_locators` | null | max 3 |
| `seed` | null | 0–4294967295, best-effort determinism |
| `previous_text` / `next_text` | null | continuity |
| `previous_request_ids` / `next_request_ids` | null | max 3 each; override text variants |
| `use_pvc_as_ivc` | false | |
| `apply_text_normalization` | auto | auto/on/off |
| `apply_language_text_normalization` | false | Japanese |
| `output_format` (query) | `mp3_44100_128` | see 3.6 |
| `enable_logging` (query) | true | false = zero-retention (Enterprise), disables history and stitching |
| `optimize_streaming_latency` (query) | — | **deprecated**; 0–4 |

#### 3.6 Output formats (`output_format`, 28 values)
- **MP3:** `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_32`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_128` (default), `mp3_44100_192` (Creator+)
- **Opus:** `opus_48000_32/64/96/128/192`
- **PCM (S16LE raw):** `pcm_8000`, `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_32000`, `pcm_44100` (Pro+), `pcm_48000`
- **WAV:** `wav_8000` … `wav_48000` (44.1 kHz Pro+)
- **Telephony:** `ulaw_8000` (Twilio), `alaw_8000`
- Web app download: MP3 128 / WAV; Advanced MP3 192 / 256, M4A, FLAC.

#### 3.7 Request stitching
- Use `previous_text`/`next_text` or `previous_request_ids`/`next_request_ids` (up to 3) so prosody flows across chunks of long text. Request IDs come from the `request-id` response header. Not available with zero-retention mode. Now supported on Text to Dialogue (2026-09-28). v4 blog: stitching "more reliable in Studio and the Reader App".
- Generation is nondeterministic; `seed` improves consistency.

---

### 4. Studio (formerly Projects) — "ElevenCreative Studio" / Studio 4.0

#### 4.1 Home / creating a project
- **Prompt bar:** "What would you like to create?" → **Studio Agent** builds a first draft.
- **Inspirations** cards + **View all Inspirations** (searchable library): Film trailer, Explainer video, Product video, Audio documentary, How to tutorial, Audio podcast, Captions.
- **Upload:** text/audio files open in the audio layout; video opens in the video layout (captions available).
- **+ New blank project** → type selector:
  - **Video project (New)** — new editor with Library, Script, Captions panels + Studio Agent.
  - **Audio project** — long-form narration, podcasts, audiobooks.
  - **Video project** — legacy video Studio.
- **Create** dialog → project settings → **Create**.
- Older flows (still referenced in help center): **Start from scratch**, **Import** (EPUB/PDF/DOCX/TXT/HTML/URL), **Generate a podcast (GenFM)**, **Create an audiobook**. Auto-assign voices exists as API alpha (`auto_assign_voices`); UI toggle [unverified].
- Imports: **EPUB** best (chapters auto-split on "Heading 1"); also PDF, DOCX, TXT, HTML, URL.
- Default model: **Eleven Multilingual v2**; change to v3/v4 etc. in **Project settings**.

#### 4.2 Studio Agent (video projects)
- AI co-editor; asks about length, tone, structure, transitions, then builds a timeline draft.
- **Mode toggle** at top of editor: **Create mode** (edits timeline, inserts clips, generates media, overlays text, adjusts audio) vs **Plan mode** (outline only).
- **Analyze clips** (frame-level footage map for precise SFX placement), in-chat asset discovery (voices, SFX), chooses from 5 image models + 5 video models (changeable at confirmation).
- Billed in credits by input/output/thinking/cache-read/cache-write tokens + media generation. Web only (not API).

#### 4.3 Audio project editor
- **Contextual sidebar:** playback controls, **Type**, **Model**, **Voice**, **Override settings**, **Generation history**. **AI Tools:** **Enhance text**, **Remove background audio** (Voice Isolator), **Use voice changer**, **Direct speech with your voice** (Actor Mode).
- **Chapters tab/sidebar:** **+** add chapter, **Chapter actions** (rename/remove), drag to reorder; auto-detected on import.
- **Text editor:** paragraphs with status bars (pale grey = unconverted, dark grey = converted); per-paragraph / per-selection voice assignment; color orbs per voice (`Cmd+Opt+A` / `Ctrl+Alt+A` shows all voices).
- **Generate / Regenerate** (2 free regens if text+voice+settings unchanged; hover shows remaining), **Regenerate selection** (words, after paragraph is generated).
- **Generation history:** all clips per paragraph; **Restore generation**; **More actions (⋯)** → download / remove (permanent).
- **Insert break:** break tag 1 s default, up to 3 s (speech only).
- **Actor Mode:** upload/record your read to guide delivery (copies accent too); shows credit cost.
- **Lock paragraph:** lock icon; narration only.
- **Undo / Redo.**
- **Timeline & tracks:** chapter-wide narration, music, SFX tracks; adjust gaps between paragraphs/sentences, trim, split, duplicate, move, **Zoom In/Out**, pan, **Expand/Collapse** (top-right). Waveforms show loudness.
- **Player (bottom):** **Play** with modes **Until end (generate clips ahead)**, **Until end (generate one at a time)**, **Selection**. Playing existing audio is free.
- **Project options** menu: **Keyboard shortcuts**, **Exports** (download previous exports). Others [unverified].

#### 4.4 Voice settings in Studio (sidebar or **Override settings** for selection/paragraph)
- **Alias** (project-only voice name, e.g. character), **Volume** (0.00 dB default, −30 to +5 dB), **Speed** (0.7–1.2), **Stability**, **Similarity**, **Style exaggeration** (some models), **Speaker boost**, **Replace voice across project** (clears affected audio).
- Voices: IVC, PVC, Voice Library, Voice Design.

#### 4.5 Video projects
- **Aspect ratio** selector (top bar): 16:9, 9:16, 4:5, 1:1.
- **Library panel:** **Project** / **Workspace** tabs; filters **Origin**, **Status**, **Timeline**; **Create +** → Media: **Video, Lip sync, Image, Speech, SFX, Music, Upload**; Elements: **Text**.
- **Script panel:** **Voiceover** paragraphs with voice + model; **Pronunciations** → Pronunciations Editor.
- **Captions panel:** choose source audio track; **Transcript** (timestamped, **Edit**); **Style** (font, color, size, placement — burned in on export).
- **Video track:** generate from prompt or upload; **Image refs**, **Reference videos**, **Start frame**, **End frame**; import video or add blank track. Lip sync via third-party models.

#### 4.6 Music, SFX, files
- **Music track:** generate from prompt (Eleven Music) or import; trim, duplicate, move, volume; stereo preserved.
- **SFX:** text prompt or **SFX library**; regenerate previews, apply, layer, trim. Not supported in ElevenReader exports or Studio API streaming.
- **Files:** drag/upload/record; **This project** / **Workspace** toggle; uploaded audio can't be published to distribution platforms.

#### 4.7 Project settings
- Model selection; **Export** tab: metadata **Title, Author, ISBN, Description**, previous versions, **volume normalization** (audiobook/ACX-style loudness).
- **Pronunciation dictionaries:** upload/create; phoneme tags (Flash v2 per Studio doc) or alias; first matching rule used; **Connect** from Pronunciations Editor drop-down; **Open all pronunciation dictionaries**.
- API-level project fields: `default_title_voice_id`, `default_paragraph_voice_id`, `default_model_id`, `quality_preset` (`standard` 128 kbps / `high` 192 kbps / `ultra` 192 kbps / `ultra_lossless` 705.6 kbps WAV), `volume_normalization`, `apply_text_normalization`, `auto_convert`, `auto_assign_voices` (alpha), `create_publishing_read`, metadata (genres, target_audience, language, fiction/non-fiction, mature_content, original_publication_date), `source_type` (blank, book, article, genfm, video, screenplay), `from_url`, `from_document`, `from_content_json`, `callback_url`.

#### 4.8 Export
- **Export** renders current chapter or whole project; unconverted paragraphs are generated and charged (cost shown first).
- Single chapter: **MP3** or **WAV**; video export if project has video track or captions (uses caption template).
- Multi-chapter: one chapter, full project as single file, or **ZIP** of per-chapter files.
- Quality: Free/Starter/Creator 128 kbps MP3 (or WAV from 128 kbps source); Pro+ 16-bit 44.1 kHz WAV or 192 kbps MP3 ("Ultra Lossless"). Hover **Format** to see older projects' setting.
- **Auto-regenerate** on bulk export: checks distortion, voice similarity, mispronunciations, missing/extra words; regenerates up to 2× free.
- **History** tab in Export dialog lists previous exports.
- **Publish:** Export > Publish > **InAudio** (LPF) or **Spotify** (MP3) — **Continue**, **Audio Preview** (first 5 min of chosen chapter), narrator name ("Digital Voice" + voice name), **Export**. IVCs must be verified (**Verify**). ElevenReader publishing exists via `create_publishing_read` [UI flow not documented].
- Free-plan video exports watermarked.

#### 4.9 Sharing & comments
- **Share:** read-only link to play timeline/mix; revocable.
- Comments timestamped at playhead (**Add comment**, **Reply**, mentions, email notifications); anonymous commenters allowed; **Resolved** collapses/pauses notifications.

#### 4.10 Limits
- 500 chapters/project, 400 paragraphs/chapter, 5,000 chars/paragraph.
- Projects: Free 5 (pricing page says 3) [conflict], Starter 20, Creator 1,000, Pro 3,000, Scale/Business 20,000.

#### 4.11 GenFM podcasts
- Requires paid plan. Web: Studio → Generate a podcast / Audio podcast inspiration; source = document (EPUB, PDF, TXT, HTML), URL, or existing project; choose **conversation** (Host + Guest, suggested pairing or any My Voices) or **bulletin** (Host only); review/edit generated script; **Convert** to audio; then edit like any Studio project.
- API `POST /v1/studio/podcasts`: `model_id`, `mode` (conversation: host_voice_id + guest_voice_id; bulletin: host_voice_id), `source` (text or url), `quality_preset`, `duration_scale` (`short` <3 min, `default` 3–7 min, `long` >7 min), `language`, `intro`, `outro`, `instructions_prompt`, `highlights` (each 10–70 chars), `callback_url`, `apply_text_normalization` (auto/on/off/apply_english).
- Exact current web dialog fields [unverified — help article returned 403].

---

### 5. Dubbing

#### 5.1 Overview & models
- 90+ target languages; preserves speaker voice characteristics; speaker detection.
- **Dubbing v2** (default on Dubbing page; "Dubbing v2 Alpha" in UI) — **automatic**, no in-app editing. Enterprise can edit transcripts and regenerate via API ("Refine and regenerate a dub"). Returns a single lossless audio file (max stereo).
- **Dubbing v1 + "Dubbing project"** → creates a **Dubbing Studio** project (manual editing). Dubbing Studio is in **maintenance mode**.
- An automatic dub cannot be converted into a Dubbing Studio project.

#### 5.2 Create dub (web)
1. Open **Dubbing** in nav.
2. **Upload** audio/video, or **Paste URL** tab (YouTube, TikTok, etc.).
3. Choose one or more **target languages**.
4. **Speaker similarity** → **Cloning strength** 0–10 (default 7; v2): higher = closer to original voice/accent, lower = more natural in target language.
5. Choose **Model** (Dubbing v2 / Dubbing v1) and **Project type** (automatic vs **Dubbing project**); **Manual mode** option (supply own script/speaker CSV).
6. Click generate (**Create Dub**) → cost confirmation.
7. Project appears at top of list with processing stages; when done, **⋯ menu → Edit** (Dubbing Studio only) or download.
- API create (`POST /v1/dubbing`) exposes additional settings likely mirrored in an "Advanced settings" panel [UI mapping unverified]: `source_lang` (auto-detect), `target_lang`, `target_accent` (experimental), `num_speakers` (0 = auto), `watermark`, `start_time`/`end_time`, `highest_resolution`, `drop_background_audio`, `use_profanity_filter` (beta), `dubbing_studio`, `disable_voice_cloning` (use Voice Library voices), `mode` (automatic/manual with CSV), `csv_file`, `csv_fps`, `foreground_audio_file`, `background_audio_file`.
- Formats: AAC, AIFF, AVI, FLAC, M4A, M4V, MKV, MOV, MP3, MP4, MPEG, MPG, OGA, OGG, OPUS, WAV, WEBA, WEBM, WMV, 3GPP; video up to 4K.
- Limits (v2, website): **2 GB** and **180 minutes**. Older docs cite max 3 simultaneous overlapping speakers.

#### 5.3 Dubbing Studio editor (v1)
- **Speaker cards** (above timeline): original transcription + translation, editable in place; speaker name top-left; **Transcribe Audio** (re-transcribe); **arrow icon** (re-translate).
- **Timeline:** speaker tracks with clips; drag cursor, horizontal scroll, timecode entry at right; drag clip edges to resize; **refresh icon** on clip = regenerate; **Split** (at cursor); **Merge** (drag ends together); drag clip to another track to reassign speaker.
- **Right-click clip:** Dynamic generation, **Clip History** (pick earlier takes), **Create Voice from Selection**.
- **Generation modes:** **Fixed Generations** (default; keeps clip duration) vs **Dynamic Generations** (clip length adapts to text).
- **Stale audio:** clips needing regeneration; regenerate individually or **Generate Stale Audio** (bulk).
- **Track settings (cog icon)** near speaker name → voice selection: **Track clone**, **Clip clone**, Voice Library voices. Clip-level settings in right panel after turning off **inherit track settings**.
- **Add track** buttons (bottom of timeline): **Voiceover track** (new speaker; write text on card, translate, **Generate**; microphone icon opens Voice Changer), **SFX track** (prompt → **Generate**; press stale button after moving/resizing), **Upload Audio** (music/background; not transcribed).
- Pronunciation dictionaries supported in project settings.
- **Export** (bottom right): AAC, MP3, WAV, **.zip of audio tracks**, **.zip of audio clips**, **AAF** (timeline), **SRT**, **CSV** (speaker, start_time, end_time, transcription, translation), MP4 video; select language before exporting. Video is ~1080p preview; audio mono (v1); 5.1 not preserved.

#### 5.4 Pricing
- Credits (web): automatic 2,000/min with watermark, 3,000/min without; Dubbing Studio 5,000/min with watermark, 10,000/min without.
- API: Dubbing v1 $0.33/min (watermark) / $0.50/min; Dubbing v2 $2.20/min; Dubbing Studio $0.50/min.
- Charged per source minute per target language; failed first language not refunded but retry free on same project.
- Free plan dubs auto-watermarked (no removal); paid plans no watermark [conflict with older "watermark reduces cost 33%" statement]. Pricing page lists Dubbing Studio from Starter.

---

### 6. Productions (human-in-the-loop managed service)

- Launched Sept 2025; dashboard at `elevenlabs.io/app/productions`. Linguists/localization professionals ("Producers") vetted by ElevenLabs.
- **Services:** **Transcripts** (native-speaker reviewed; ~99% accuracy claim), **Subtitles** (formatted/timed, accessibility tags), **Dubbing** (human-reviewed translation + voices + sync), **Audiobooks** (coming soon; single/multi-speaker casting).
- **Ordering:** create order on Productions page, or choose **Productions** in the Speech to Text / Dubbing order dialog; existing assets: **Get human review** (editor top-right). Choose language + **style guide** options → estimated price → **Continue** (file analyzed, final price) → checkout (Enterprise deducted from workspace credits) → track in sidebar + email → **View** (read-only) / export menu / invoices link next to **Details**. Folders via **Manage > Move to Folder**.
- **Dubbing deliverables:** MP4 (default), AAC/MP3/WAV, ZIP of tracks/clips, AAF, SRT, TXT transcript; option to **normalize audio** on export. Feedback via ⋯ → **Feedback**; can open in Dubbing Studio to refine.
- **Turnaround:** dubbing target within 7 business days; Enterprise expedited (productions@elevenlabs.io).
- **Pricing:** USD per source minute, varies by asset/language/style guide; reported from **$2.00/min** at launch [third-party]; custom quotes for dubbing; "5–10x cheaper than traditional LSPs".
- **Languages:** Arabic, English, French, German, Hindi, Italian, Portuguese, Russian, Spanish, Turkish, Ukrainian (expanding).
- Post-delivery changes not possible on-platform (planned).

---

### 7. Could not verify / gaps
- Full TTS page layout (exact placement of tabs, character counter, "Enhance" tag button for v3/v4, reset-to-default button).
- Whether credits per character differ for v4 / v4 Turbo / v3 Conversational in the web app.
- Exact v4 voice settings in UI (docs conflict on Speed availability).
- Max chars for v4 Turbo, v3 Conversational.
- Full Studio toolbar and Project options menu contents; complete keyboard shortcut list; GenFM web dialog fields (help article 403).
- Dubbing create-dialog "Advanced settings" field names in current UI (API params listed instead).
- Phoneme-tag model support (conflicting docs).
- Free-plan Studio project count (3 vs 5).

---

### Sources
- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/capabilities/text-to-speech
- https://elevenlabs.io/docs/product-guides/playground/text-to-speech
- https://elevenlabs.io/docs/best-practices/prompting/eleven-v3
- https://elevenlabs.io/docs/best-practices/prompting
- https://elevenlabs.io/docs/best-practices/prompting/controls
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input
- https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- https://elevenlabs.io/docs/capabilities/text-to-dialogue
- https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/pronunciation-dictionaries
- https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-file
- https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/add
- https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/set
- https://elevenlabs.io/pricing
- https://elevenlabs.io/pricing/api
- https://elevenlabs.io/docs/changelog
- https://elevenlabs.io/blog/eleven-v4
- https://elevenlabs.io/blog/elevenlabs-audio-tags-list
- https://elevenlabs.io/v4
- https://elevenlabs.io/docs/product-guides/products/studio
- https://elevenlabs.io/docs/eleven-creative/products/studio
- https://elevenlabs.io/docs/api-reference/studio/add-project
- https://elevenlabs.io/docs/api-reference/studio/create-podcast
- https://elevenlabs.io/blog/genfm-podcasts-in-projects
- https://help.elevenlabs.io/hc/en-us/articles/30727178607505-How-do-I-use-GenFM (403 at fetch time)
- https://elevenlabs.io/docs/help-center/product/studio/studio/on-what-plans-can-i-use-studio
- https://elevenlabs.io/docs/product-guides/products/dubbing
- https://elevenlabs.io/docs/product-guides/products/dubbing/dubbing-studio
- https://elevenlabs.io/docs/api-reference/dubbing/create
- https://help.elevenlabs.io/hc/en-us/articles/23795700806929-On-which-plans-can-I-use-Dubbing
- https://elevenlabs.io/docs/services/productions/dubbing
- https://elevenlabs.io/docs/eleven-creative/services/productions/overview
- https://elevenlabs.io/blog/introducing-productions-human-edited-content-done-for-you
- https://elevenlabs.io/productions
- Third-party: https://unite.ai/elevenlabs-launches-eleven-v4-with-low-latency-turbo-variant , https://openrouter.ai/elevenlabs/eleven-v4 , https://datanorth.ai/news/elevenlabs-releases-eleven-v4-and-eleven-v4-turbo , https://geekflare.com/news/elevenlabs-launches-audio-service-for-creators , https://alternativeto.net/news/2025/9/elevenlabs-launches-productions-managed-service-with-dubbing-captions-and-human-editing


---

# PART 2
## ElevenLabs: Voices, Voice Changer, Voice Isolator, Sound Effects, Music, Image & Video, Forced Alignment, Audio Native

*Research date: 2026-10-10. Primary sources: the official docs at elevenlabs.io/docs, which serve raw Markdown at `<page>.md`, plus the API reference pages. Third-party sources are marked as such. The "Unverified / conflicting" section at the end lists the gaps.*

**API base URL:** `https://api.elevenlabs.io`. Alternate servers listed in the API reference: `api.us.elevenlabs.io`, `api.eu.residency.elevenlabs.io`, `api.in.residency.elevenlabs.io`, `api.sg.residency.elevenlabs.io`. Authentication uses the `xi-api-key` header. SDKs: `pip install elevenlabs` and `npm install @elevenlabs/elevenlabs-js`. A CLI is also available (`brew install elevenlabs/tap/elevenlabs`, `npm i -g @elevenlabs/cli`, then `elevenlabs auth login`).

---

### 1. Voices: overview and voice types

The **Voices** item in the sidebar holds **My Voices** (app URL `/app/voice-lab`) and **Explore**, which is the Voice Library (`/app/voice-library`).

| Voice type | How it's created | Shareable to the Voice Library? | Uses a custom voice slot? |
|---|---|---|---|
| **Community** | Saved from the Voice Library | n/a (already shared) | **No** |
| **Instant Voice Clone (IVC)** | From short audio samples | No (workspace sharing only) | Yes |
| **Professional Voice Clone (PVC)** | Fine-tuned model; needs a Creator plan or higher | **Yes** (the only type that can be shared) | Yes (separate PVC slot count) |
| **Voice Design (generated)** | From a text prompt | No (workspace sharing only) | Yes |
| **Default / premade** | Built in | n/a | n/a |

- **Default voices are being retired.** "All our Default voices will expire on **December 31, 2026**." ElevenLabs is replacing them with new voices that users can keep "in perpetuity."
- The Voice Library holds **10,000+** community voices. ElevenLabs says it has paid out **more than $14M** to voice owners.
- **Free-tier users cannot use Voice Library voices through the API.**
- Voices can be created in **32 languages**. Multilingual v2 supports 29 languages and Flash v2.5 supports 32. The Eleven v4 family (the latest TTS model) supports **90+ languages**, and the PVC FAQ lists all of them.
- Model notes: Eleven v4 is the latest TTS model. Voice Design voices work with v4 but "may be less performative" on it. PVCs are "fully supported on Eleven v4" and "not fully optimized for Eleven v3."

---

### 2. My Voices

**What's on each voice row:**
- The language the voice was trained on
- Category (for example, "Narration")
- Notice period length, if the voice has one
- A **voice type icon**:
  - Yellow tick: Professional Voice Clone
  - **Black tick**: Studio Quality PVC
  - **Lightning icon**: Instant Voice Clone
  - No icon: Voice Design voice
- An **exclamation icon** means new models are available to fine-tune a PVC on.
- A **clock icon** means a notice period is active (hover over it for details).
- Per-row buttons:
  - **T**: opens Text to Speech with this voice selected
  - **View**: opens the detail view; the sharing icon at the bottom leads to **View Metrics**
  - **Use voice**

**More actions (three-dot) menu:**
- **Copy voice ID**
- **Edit voice**: changes the name and description; the changes are visible only to you.
- **Share voice**: opens a sharing modal (see below).
- **View history**: shows earlier TTS generations made with this voice.
- **Add to collection**: add to an existing collection or create a new one.
- **Publish to Library**: for PVCs only. It is also highlighted at the top of My Voices.
- **Edit in Library**: for shared PVCs. Opens **Manage your voice**, which contains Custom voice preview, **Exclude free users**, and the **Publish to the Voice Library** toggle.
- **Delete voice**: permanent, with a confirmation dialog.

**Collections:**
- Click **Collections**, then **Create collection**. Give it a name and choose an icon.
- **Shift + Click** selects multiple voices.
- Drag voices onto a collection to add them, or onto the **trash can** icon to delete them.

**Sharing a voice privately** (More actions, then **Share Voice**):
- **Add users or groups** field: shares with members of your workspace.
- **Anyone with the link** toggle: creates an external link that adds the voice to the recipient's account. This works for **PVC only**. IVC and Voice Design voices can be shared only within the workspace.

**PVC model status (hover over the voice name to see each model):**
- Draft
- "The training run has been scheduled"
- "Creating dataset" / "Running fine-tuning" (shown with a %)
- "...experienced issues and has been retried"
- "Voice is ready to be used with the model"
- "Click to start fine-tuning"

A tick next to a model means it is trained. A plus means you can start fine-tuning on that model.

**API (voices):**

| Action | Endpoint |
|---|---|
| List / search voices (v2) | `GET /v2/voices`. Params: `search`, `page_size` (≤100), `next_page_token`, `sort` (`created_at_unix`\|`name`), `sort_direction`, `voice_type` (`personal`, `community`, `default`, `workspace`, `non-default`, `non-community`, `saved`), `category` (`premade`, `cloned`, `generated`, `professional`), `fine_tuning_state` (`draft`, `not_verified`, `not_started`, `queued`, `fine_tuning`, `fine_tuned`, `failed`, `delayed`), `collection_id`, `gender`, `age`, `language[]`, `accent`, `use_cases[]`, `min_notice_period_days`, `include_custom_rates`, `include_live_moderated`, `high_quality`, `include_total_count`, `voice_ids[]` |
| List voices (legacy) | `GET /v1/voices` |
| Get voice | `GET /v1/voices/{voice_id}`. The response includes `disable_at_unix` when a notice period is active. |
| Edit voice | `POST /v1/voices/{voice_id}/edit` |
| Delete voice | `DELETE /v1/voices/{voice_id}` |
| Voice settings | `GET /v1/voices/settings/default`, `GET /v1/voices/{voice_id}/settings`, `POST /v1/voices/{voice_id}/settings/edit` |
| Voice samples | `GET /v1/voices/{voice_id}/samples/{sample_id}/audio`, `DELETE /v1/voices/{voice_id}/samples/{sample_id}` |
| Accents list | `GET /v1/voices/accents` |
| Collections | `GET/POST /v1/voices/collections`, `GET/PATCH/DELETE /v1/voices/collections/{collection_id}`, `POST/DELETE /v1/voices/collections/{collection_id}/voice/{voice_id}` |
| Replicate to isolated environment | `POST /v1/voices/{voice_id}/replicate-to-isolated-environment` |

---

### 3. Voice Library (Explore)

**Ways to find voices:**
- **Handpicked Collections**: curated, updated regularly, and grouped by use case, genre, and language.
- **Search bar**: search by name, keyword, or **voice ID**.
- **Audio search**: drag and drop an audio or video file anywhere on the page, or click the **upload icon**. It finds the original voice if it's in the library, plus similar voices. Upload clean speech; Voice Isolator can help clean it first.
- **Sort**: **Trending**, **Latest**, **Most users**, **Character usage**.
- Click a voice to play its sample. If a voice has previews in several languages, choose the language in the **bottom player**.
- **Use voice** button: opens TTS with the voice preselected. It also records the voice's notice period on your account, so you keep access even if you never saved the voice.
- **+ button**: saves the voice to My Voices. This does **not** use a custom voice slot.

**Filters:**

| Filter | Options |
|---|---|
| Language | Any supported language. Voices assessed as multilingual also appear. |
| Accent | Appears only after a language is selected |
| Category | Conversational, Narration, Characters, Social Media, Educational, Advertisement, Entertainment |
| Gender | Male, Female, Neutral |
| Age | Young, Middle Aged, Old |
| Notice period | Only voices with a notice period, or a specific period (max 2 years) |
| Live Moderation | Exclude live-moderated voices (marked with a **shield icon** label) |
| Quality | **Any** / **Studio Quality** (QA-reviewed, professionally recorded) |
| Custom rate | Exclude voices that have a custom rate / credit multiplier |

**Credit multipliers / custom rates:** a voice can show a multiplier tag (for example, 2x means each generation costs twice the credits). TTS shows a notification when you pick such a voice. Custom rates are a **legacy** feature; newly shared voices can't set one. Some voices are paid-only: free users see "This voice is not available for free users."

**Notice period:**
- The minimum is **30 days** and the maximum is **2 years**. A voice can also have no notice period, which means immediate removal.
- Longer notice periods earn **higher rewards**.
- When an owner stops sharing, the voice disappears from the library right away. Users who saved or used it keep access until the period ends and get **email and in-app** notifications that also suggest similar voices.
- Webhook notifications for voice removal can be set up at `/app/settings/webhooks`.
- Re-sharing a voice resets its notice period.

**Live Moderation:** the voice owner can opt in. Generation text is checked against prohibited categories, which **may add latency**. The legal terms are in the Voice Library Addendum (elevenlabs.io/vla).

**Policies:**
- Only human-verified PVCs can be shared. AI-generated or AI-enhanced voices are banned.
- No child or child-like voices.
- Evading the CAPTCHA can lead to a permanent ban.

#### Publishing a PVC (More actions, then Publish to Library)
1. Turn on the **Publish to the Voice Library** toggle.
2. Set the **notice period** and the **Live Moderation** option.
3. Enter a **Name**. It must be 40 characters or fewer and follow the pattern "Name - traits/persona", for example "Serena - Calm, Friendly, Warm". It must not contain public figure or brand names, social handles, ALL CAPS words, emojis or symbols, explicit words, or the word "voice".
4. Enter a **Description**: specific use cases and qualities, nothing spammy.
5. Set **labels**: language, accent, gender, age, use case, tone, style.
6. Accept the **Voice Library Addendum** and the consents.
7. Submit. Manual review follows, and there is no ETA for it.

- **Custom voice preview**: go to Edit in Library, then Manage your voice, then the **Custom voice preview** dropdown. Only your TTS generations of **70–150 characters** are eligible; any model can be used, including v3.
- **Exclude free users** toggle: blocks new additions by free-tier users. Users who already added the voice keep it, though the voice may lose visibility on trending lists.
- **Available in ElevenReader** toggle: for Studio Quality voices only. Reader rewards are reported separately (tick the "ElevenReader" box in View Metrics).
- **Studio Quality bonus**: when a shared PVC is marked Studio Quality, you get **+1 PVC slot**. This can happen more than once.

**API (library):**
- `GET /v1/shared-voices`. Params:
  - `page_size` (≤100, default 30), `page`
  - `category`, `gender`, `age`, `accent`, `language`, `locale`, `search`
  - `use_cases[]`, `descriptives[]`, `featured`
  - `min_notice_period_days`, `include_custom_rates`, `include_live_moderated`
  - `reader_app_enabled`, `owner_id`
  - `sort` = `created_date` | `usage_character_count_1y` | `trending` | `cloned_by_count`
- Add a shared voice to your account: `POST /v1/voices/add/{public_user_id}/{voice_id}` (body: `new_name`, `bookmarked`).
- Find similar voices by audio: `POST /v1/similar-voices` (`audio_file`, `similarity_threshold` 0–2, `top_k` 1–100).

#### Payouts / rewards
- Payouts are processed through **Stripe Connect**. To set it up, go to the profile icon, then **Payouts** (`/app/payouts`), and follow the Stripe prompts.
  - Buttons: **Complete Account Setup**, **Manage Account**, and **Update** (for the W-8/W-9 form).
- You do **not** need a paid ElevenLabs subscription to receive payouts.
- Earnings come only from usage by **paid** users. Your default rate depends on the **notice period** you chose.
- Payouts run about **weekly (every 6–8 days)** once the balance passes the threshold. The threshold is usually **$10**; some countries have a higher one.
- **Tax:**
  - A W-8 or W-9 form is required.
  - Usage by US customers has **30% US withholding** unless a tax-treaty rate is claimed. The income type to select is "Royalties – Copyrights."
  - Form **1042-S** is issued by March 15 of the following year.
- Track usage under My Voices, then **View**, then the sharing icon, then **View Metrics**. All-time earnings appear on the Payouts page.
- **Supported countries:** about 60, wherever Stripe Connect is available. Outside Europe the list is AR, AU, CA, CL, CO, HK, IN, ID, IL, JP, MY, MX, NZ, NG, PE, PH, QA, SA, SG, ZA, KR, TH, TW, TR, AE, US, UY, VN. Most of Europe is covered too, including the UK, EU states, Iceland, Liechtenstein, Monaco, Norway and Switzerland. **Brazil is not on the list.**
- **Exact per-character reward rates per notice period are not published in the docs I read.** I could not verify them.

---

### 4. Voice Design (text-to-voice)

- **Path:** Voices, then My Voices, then **Add a new voice**, then **Voice Design** (`/app/voice-lab?create=true&creationType=voiceDesign`).
- **Inputs:**
  - **Voice description / prompt**: 20–1000 characters.
  - **Text to preview**: 100–1000 characters. The box shows how many characters will be charged. An **Auto-generate** button writes a preview script, including audio tags.
- **Sliders:**
  - **Loudness**: volume of the preview and of the saved voice. API range is -1 to 1; 0 is about -24 LUFS; default 0.5.
  - **Guidance Scale**: how strictly the voice follows the prompt. Higher values match the prompt more closely but can cost quality or sound robotic. The docs' examples use 20–40%.
- Clicking **Generate voice** returns **3 previews**. You pay only for the preview text, charged once. **Select** one and save it; saving uses a voice slot.
- **Prompt template:**
  ```
  Native <Language>. <Gender>, <Age range>. <Quality level>.
  Persona: <2–5 words>. Emotion: <2–3 adjectives>.
  <1–2 sentences about timbre, pacing, delivery>
  ```
- **Quality descriptors:** Ok, Good, Very good, Excellent, Studio, Broadcast quality, or "perfect audio quality". To get lo-fi on purpose, use phrases like "Low-fidelity audio" or "Sounds like a voicemail".
- **Pitfalls to avoid:**
  - Don't write "accent" when you mean intonation; it causes dialect shifts.
  - Avoid FX words such as reverb, echo, phone, or tape.
  - State the language and dialect in the first sentence.
  - Prefer "thick" over "strong" when describing an accent.
- **Attribute vocabulary:** Age, Accent, Gender, Tone/Timbre (deep, gravelly, breathy…), Pacing (staccato, drawn out…), Audio Quality, Character/Profession, Emotion, Pitch.
- **Preview text** should match the persona. Longer text gives more stable results.

#### Voice Remixing
- **Inputs:**
  - Voices you own (IVC, PVC, or Voice Design)
  - Voices you have explicit permission for
  - Voice Library voices with an **infinite notice period**
  - *(The TTS guide also says you "can't remix voices from the Voice Library", which conflicts with the line above.)*
- **What it changes:** gender, accent, speaking style, pacing, audio quality, via a natural-language prompt.
- **Prompt Strength:** **Low / Medium / High / Max**.
- **Script:** Default scripts, or a custom script that supports v3 tags (`[laughs]`, `[whispers]`, `[sighs]`).
- Remixing is iterative with no limit. The original voice is left unchanged. Output is a v3 voice that is backward-compatible with other models. You're charged for the length of the test script.

**API:**
- Design: `POST /v1/text-to-voice/design`
  - `voice_description` (required)
  - `model_id`: `eleven_multilingual_ttv_v2` (default) or `eleven_ttv_v3`
  - `text` (100–1000), `auto_generate_text`
  - `loudness` (-1..1, default 0.5), `guidance_scale` (default 5), `seed`, `quality`
  - `should_enhance` (AI prompt expansion)
  - `stream_previews`
  - `reference_audio_base64` and `prompt_strength` (v3 only; balances the prompt against the reference audio)
  - `remixing_session_id`, `remixing_session_iteration_id`
  - `output_format`
- Save a preview as a voice: `POST /v1/text-to-voice` (`voice_name`, `voice_description`, `generated_voice_id`, `labels`, `played_not_selected_voice_ids`)
- Stream a preview: `GET /v1/text-to-voice/{generated_voice_id}/stream`
- Remix: `POST /v1/text-to-voice/{voice_id}/remix` (`voice_description` = the changes, `text`, `auto_generate_text`, `loudness`, `guidance_scale` default 2, `seed`, `prompt_strength`, `stream_previews`, remixing session IDs)
- Legacy: `POST /v1/text-to-voice/create-previews`

---

### 5. Instant Voice Cloning (IVC)

- **Path:** in **Voices**, click the **+** icon (or **Create Voice**) and choose **Instant Voice Clone**. Upload or record audio, set the name and labels, tick the rights/consent confirmation, then click **Save voice**. To use it, go to My Voices and click **Use voice**.
- IVC **does not train a model**. It infers the voice from prior training data, so unusual voices or accents may clone poorly.
- **Audio:**
  - Aim for 1–2 minutes of clean audio. Use at least 1 minute and no more than about 3 minutes; more can make the clone worse.
  - Total runtime matters, not the number of files.
  - Use MP3 at ≥128 kbps; the FAQ recommends ≥192 kbps. WAV doesn't help and can cause upload issues.
  - Target **-23 to -18 dB RMS** with a **-3 dB true peak**.
  - Keep tone and performance consistent; the clone copies the pacing, breaths, and noise.
- Clones can't be exported. They can be used through the API, and the original samples should be kept if you want to recreate the clone.
- **API:** `POST /v1/voices/add` (multipart: `name`, `files[]`, `remove_background_noise`, `description`, `labels` with keys language, accent, gender, age)

---

### 6. Professional Voice Cloning (PVC)

- Available on **Creator plan and higher**. You can clone **your own voice only**, even if someone else consents. Singing is not supported.
- **PVC slots:**

  | Plan | Slots |
  |---|---|
  | Free, Starter | 0 |
  | Creator, Pro, legacy Scale | 1 |
  | Scale, legacy Business | 3 |
  | Business | 10 |
  | Enterprise | Custom |

  Each shared voice marked Studio Quality adds one slot. If you downgrade below Creator, the PVC stays on the account but can't be used.

**Steps:**
1. In **Voices**, click **Create Voice**, then **Professional Voice Clone**.
2. Click **Upload samples**, or **Record yourself**. Recording offers built-in scripts for narrative, conversational, and advertising styles, or you can upload your own script.
3. Check the **sample-length feedback**. Upload at least 30 minutes, ideally 1 hour, and as close to 2–3 hours as you can (the docs also give 30–180 minutes). Split long audio into files of about 30 minutes.
4. Click **Audio settings** next to each clip to **remove background noise** or **separate speakers**.
5. **Verify (voice captcha):** read the on-screen text within the time limit and press **Stop** after reading it once.
   - Use the same microphone and delivery as your samples.
   - If you fail every attempt, wait **24 hours** or ask support to reset your attempts.
   - Once you reach verification you're locked in: an unverified PVC can't be deleted.
6. **Fine-tuning** usually takes **3–6 hours** and can take up to 24 hours. You're notified in-app and by email.
   - PVCs train automatically on Flash v2.5, Turbo v2.5, and Multilingual v2. English PVCs also train on Flash v2 and Turbo v2.
   - Other models are added by clicking them (**Click to start fine-tuning**).
7. Use the voice: go to Voices, then the **Personal** tab, then **Use**.
   - If you see "No model found for this voice", fine-tuning hasn't finished.

**Audio quality guidance:**
- Use a treated room or a DIY booth (a duvet or closet works).
- Use an XLR mic with an interface (for example, Focusrite with an AT2020 or Rode NT1, roughly $300–500) and a **pop filter**.
- Stay about **two fists (~20 cm)** from the mic and speak at an angle.
- Record WAV at 44.1/48 kHz with **24-bit** depth. REAPER or Audacity work; don't use plugins or denoisers.
- Peaks should sit at **-6 to -3 dB** with an average around -18 dB, or -23 to -18 dB RMS with a -3 dB true peak.
- Use a single speaker and one consistent style.
- Record in the target language. Recordings in unsupported languages are rejected.
- Pre-edit out ums and long pauses; the clone copies them.

**API:**

| Step | Endpoint |
|---|---|
| Create PVC | `POST /v1/voices/pvc` (`name`, `language`, `description`, `labels`) |
| Update PVC | `POST /v1/voices/pvc/{voice_id}` |
| Add samples | `POST /v1/voices/pvc/{voice_id}/samples` |
| Update / delete sample | `POST` / `DELETE /v1/voices/pvc/{voice_id}/samples/{sample_id}` |
| Sample audio / waveform | `GET .../samples/{sample_id}/audio`, `GET .../samples/{sample_id}/waveform` |
| Speaker separation | `POST .../samples/{sample_id}/separate-speakers`, `GET .../samples/{sample_id}/speakers`, `GET .../speakers/{speaker_id}/audio` |
| Get captcha | `GET /v1/voices/pvc/{voice_id}/captcha` |
| Verify captcha | `POST /v1/voices/pvc/{voice_id}/captcha` (`recording` file) |
| Manual verification | `POST /v1/voices/pvc/{voice_id}/verification` |
| Train | `POST /v1/voices/pvc/{voice_id}/train` (`model_id`) |

---

### 7. Iconic Marketplace (licensed celebrity/IP voices)

- **URL:** elevenlabs.io/iconic-marketplace. **Launched November 2025** with CMG Worldwide as a partner (third-party press).
- **Flow:**
  1. **Browse Voices**
  2. **Submit a Request**: describe the project's format, purpose, audience, and use.
  3. **Approval & Agreement**: the rights holder decides, and a license agreement is signed.
  4. **Production & Delivery**
- Timelines vary from quick to several weeks.
- **Buttons on the page:** "Request Voice" (on each voice), "Request voice" (to ask for another icon), "Submit Talent", "Try now", "Learn more", "Contact sales". The catalog section is "Browse all voices".
- **Catalog examples:** Sir Michael Caine, Judy Garland, John Wayne, Dr. Maya Angelou, Richard Feynman, J. Robert Oppenheimer, Thomas Edison, Stan Lee, David Hasselhoff, Art Garfunkel, Optimus Prime, Megatron, Starscream, Grimlock, Cobra Commander, Mr. Potato Head, Mr. Monopoly, and the Clue characters (Colonel Mustard, Miss Scarlett, Professor Plum, and others).
- **Terms:**
  - Every approval includes commercial rights. Territories and timeframes are set per agreement.
  - Submitting a request doesn't guarantee approval.
  - Talent applies through partnerships@elevenlabs.io.
- **No pricing, filter UI, or form fields are published, and there are no API endpoints.** I could not verify these, or whether the marketplace appears inside the app's Voices section.

---

### 8. Voice Changer (speech-to-speech)

- **Location:** Playground, then **Voice Changer**. It was previously called Speech-to-Speech.
- **Input:**
  - Upload by clicking or dragging into the audio box, or record live: **Record Audio**, then the **Microphone** button, then **Stop**, then play it back.
  - Limits: **≤50 MB** and **≤5 minutes** (300 s) on every plan. Split longer audio.
  - Audio formats: MP3, M4A, FLAC, OGA, OGG, WAV.
  - Video formats: MKV, WEBM, MP4, MOV.
- **Cost:** **1,000 characters per minute**, based on duration only. The cost appears at the bottom-left, and you're charged only when you click **Generate**.
- **Settings** (shared with TTS):
  - Voice picker
  - Model: `eleven_multilingual_sts_v2` (29 languages; often better even for English) or `eleven_english_sts_v2`
  - **Stability** slider
  - **Similarity** slider
  - **Style exaggeration** (keep at 0)
  - **Speaker Boost** toggle
  - **Remove Background Noise** toggle (unique to Voice Changer)
  - Common defaults: stability about 50, similarity about 75, style 0.
  - *Speed is a TTS setting; the docs don't say whether Voice Changer has a speed control.*
- **Output:** the **download** button (bottom right), or the **History** tab in the right panel. Downloads are MP3 or WAV, and the **Advanced** option offers more formats.
- **Best practices:**
  - The output keeps the input's accent and cadence. For example, voice "George" with an American performance gives George with an American accent.
  - Perform expressively.
  - Set mic gain carefully.
- **API:**
  - `POST /v1/speech-to-speech/{voice_id}` (multipart): `audio`, `model_id`, `voice_settings` (JSON string), `seed`, `remove_background_noise`, `file_format` (`pcm_s16le_16` for low latency, or `other`), `output_format` (default `mp3_44100_128`), `enable_logging` (false = zero retention, Enterprise only)
  - Streaming: `POST /v1/speech-to-speech/{voice_id}/stream`

---

### 9. Voice Isolator

- **Location:** Audio Tools, then **Voice Isolator** (`/app/voice-isolator`).
- **Use:** upload or drag in a file, or record with the mic. Click **Isolate voice**, then play back or download the result.
- **Limits:** **500 MB** and **1 hour**.
- **Cost:** **1,000 characters per minute**.
- **Formats:**
  - Audio: AAC, AIFF, OGG, MP3, OPUS, WAV, FLAC, M4A
  - Video: MP4, AVI, MKV, MOV, WMV, FLV, WEBM, MPEG, 3GPP
- Not optimized for separating vocals from music. For that, see Music stem separation.
- **API:**
  - `POST /v1/audio-isolation` (`audio`, `file_format`, `preview_b64`)
  - `POST /v1/audio-isolation/stream`
  - `GET /v1/audio-isolation/history`
  - `DELETE /v1/audio-isolation/history/{history_item_id}`

---

### 10. Sound Effects

- **Location:** Playground, then **Sound Effects** (`/app/sound-effects`).
- **Prompt:** up to **450 characters**.
- **Settings panel:**
  - **Duration**: **Auto** or a fixed value, up to **30 s**. The API range is 0.5–30 s; the overview page says 0.1.
  - **Looping** toggle: makes a seamless loop with the end blending into the start. Example use: 30 s of rain looped indefinitely.
  - **Prompt influence** slider, **default 30%**. High is literal; low is creative.
- Click the **arrow** to generate. Each run produces **4 variations**.
- **Tabs:**
  - **History**: **download** icon (MP3 44.1 kHz or **WAV 48 kHz**; WAV only for non-looping effects) and a **star** icon that saves to Favorites.
  - **Favorites**
  - **Explore**: the community SFX library
- **Cost:**
  - Through the API, **40 credits per second** when a duration is set.
  - Otherwise it depends on settings, not prompt length. See the pricing page.
  - A third-party source quotes $0.0194 per effect on the API (unverified).
- **Prompting:**
  - Simple: "Glass shattering on concrete".
  - Sequences: "Footsteps on gravel, then a metallic door opens". For best results, generate each part separately and combine them.
  - Musical: "90s hip-hop drum loop, 90 BPM", "Vintage brass stabs in F minor".
  - Terminology: Impact, Whoosh, Ambience, One-shot, Loop, Stem, Braam, Glitch, Drone.
- **Model:** `eleven_text_to_sound_v2` (SFX v2 launched around September 2025; press reports 30 s, looping, 48 kHz, and a reorganized library with search, favorites, and **remix**).
- **API:** `POST /v1/sound-generation`
  - `text` (required)
  - `loop` (bool, v2 only)
  - `duration_seconds` (0.5–30, null = auto)
  - `prompt_influence` (0–1, default 0.3)
  - `model_id`
  - `output_format` query param: mp3/pcm/ulaw/alaw/opus variants. mp3_192 needs Creator or higher; pcm_44100 needs Pro or higher.

---

### 11. Eleven Music

**Models:**
- **Music v2.5**: the most advanced model (`music_v2_5`).
- **Music v2**: the UI default since about May 2026, per a third-party source.
- **Music v1**: still in a transition period. It is still the **API default** (`model_id` default = `music_v1`). It will be deprecated with months of notice.

**v2 features:**
- Audio Reference
- Long-form, section-by-section composition
- Genre changes mid-track
- Fast rap and dense vocals
- Better inpainting
- Sound effects inside tracks
- Multilingual vocals: English, Spanish, German, Japanese, and more

#### UI (Music, then Generations)
1. Write the **Prompt**.
2. Optionally add a reference with **+ Reference** (about 30 s of audio; copyright-screened).
3. Optionally pick a **Finetune** from the selector (Curated or Custom).
4. Set **Settings**:
   - **Model dropdown** (v1 / v2 / v2.5)
   - **Variants** (how many to generate)
   - **Duration**: a fixed value (30s, 1m, …) or **Auto**
5. Click **Generate**. Hover over **credits remaining** to see the cost before generating.

**Editor:**
- **Section view and timeline**. Add sections with **"+ Add Section"** (hover a section; "Add section below") or the **"+"** at the end of the timeline. **Drag** a section edge to change its duration. Delete with the **X** on the section's corner.
- **Section text boxes**: edit lyrics, or use bracketed directions such as `[energetic guitar solo]` and `[drum fill]`.
- **"Edit styles of this section"** opens the **Section styles** window with **Include styles** and **Exclude styles**, then **Save**.
- **Conversational box** ("Continue the conversation…"): natural-language edits such as "Make the chorus more energetic" or "translate to Spanish".
- After any edit, a notice reads **"Song composition has changed."** Nothing is applied until you click **Generate**.
- **Inpainting**: select a section and regenerate only that section.
- **Download** and **Share** buttons. Share creates a link with a **customizable visualizer**.

**Other details:**
- **Export:** MP3 at 44.1 kHz, 128–192 kbps; the API default for v2 models is `mp3_48000_192`. WAV is mentioned on the capabilities page.
  - Free, Starter, Creator: standard quality.
  - Pro and higher: high-fidelity.
- **Duration:** minimum 3 s. The maximum is given as 5 minutes on the capabilities page, but 10 minutes in the FAQ and the API (`music_length_ms` up to 600,000).
- **Licensing:** trained in collaboration with labels and publishers, and "cleared for nearly all commercial uses". Per-plan rules are at elevenlabs.io/music-terms. API access requires a **paid plan**.

**Prompting best practices:**
- Decide all five of: genre, mood, instrumentation, tempo (BPM), and era.
- Use studio vocabulary such as sidechained, close-mic'd, plate reverb, or tape saturation.
- Give the key, for example "in A minor".
- Describe vocal delivery: whispered, belted, stacked harmonies, or "two singers harmonizing in C".
- Narrate the arrangement: "start with just…, then bring in…".
- For loops, give bars, BPM, and key, and say what to exclude ("no melody — just drums").
- Add "instrumental only" to drop vocals.
- Use timing cues such as "lyrics begin at 15 seconds".
- For stems, write "solo <instrument>" or "a cappella <vocal>".
- Sound-design prompts are supported.
- Naming artists or quoting copyrighted lyrics returns a `bad_prompt` error with a `prompt_suggestion`.

#### Music Finetunes
- **Path:** go to Finetunes, then **Create Finetune**, and upload tracks. Training takes about **5–10 minutes**.
- **Limits:** ≤50 tracks, 10–600 s each, ≤30 MB each, ≤250 minutes in total.
- **Copyright:**
  - No copyrighted music, even if you bought, licensed, or performed it.
  - Uploads are screened automatically. If the check fails, the Finetune is rejected and **not refunded**.
  - Qualifying Enterprise customers can be exempted for IP they own.
- **Curated Finetunes:** Afro House Beats, Reggaeton, Arabic Groove, 70s Cambodian Rock, 80s Nu-Disco Revival, Mozart-Style Symphony.
- **API:** "UI at launch", but endpoints exist:
  - `POST /v1/music/finetunes` (`name` 5–200 chars, `primary_genre`, `files`, `tags`, `visibility` private/workspace, `model_id`)
  - `GET /v1/music/finetunes`
  - `GET/PATCH/DELETE /v1/music/finetunes/{finetune_id}`
  - Generate with one using `finetune_id` in compose.

#### Music Marketplace
- A library of user-published songs that others can license. Buyers can download and remix while subscribed.
- **Licenses:**
  - **Social Media**: own channels, monetized videos, podcasts.
  - **Paid Marketing**: adds ads and client work.
  - **Offline**: adds live events, venues, in-store use.
  - **Enterprise/Custom**: TV/film/OTT, radio, large games.
- **Prohibited:** distribution to Spotify, Apple Music, or similar, and resale.
- **Creators** earn **from 25%** of each sale, paid through the payout system. Terms are in the Music Marketplace Addendum (elevenlabs.io/mma).

#### Music API

| Action | Endpoint |
|---|---|
| Compose | `POST /v1/music`. Params: `prompt` **or** `composition_plan`, `music_length_ms` (3,000–600,000), `model_id` (`music_v1`\|`music_v2`\|`music_v2_5`), `seed`, `force_instrumental`, `finetune_id`, `respect_sections_durations` (v1 only), `store_for_inpainting`, `sign_with_c2pa`, `output_format` (default `auto`) |
| Stream | `POST /v1/music/stream` |
| Compose with details (plan + metadata + audio) | `POST /v1/music/detailed`; streaming: `POST /v1/music/detailed/stream` |
| Create composition plan | `POST /v1/music/plan` (`prompt`, `music_length_ms`, `source_composition_plan`, `model_id`). Free (no credits used) *(per older docs; not re-verified)* |
| Upload song (for inpainting) | `POST /v1/music/upload` (`file`, `extract_composition_plan`, `with_timestamps`, `with_waveform_visual`) |
| Stem separation | `POST /v1/music/stem-separation` (`file`, `stem_variation_id`, `output_format`, `sign_with_c2pa`) |
| Video to music | `POST /v1/music/video-to-music` (up to 10 videos, ≤200 MB combined; `description` ≤4,100 chars; `tags` ≤10; `model_id`) |

**Composition plan schemas:**
- **v1 `MusicPrompt`:**
  - `positive_global_styles[]`, `negative_global_styles[]`
  - `sections[]`, each with `section_name` (1–100 chars), `positive_local_styles[]`, `negative_local_styles[]`, `duration_ms` (3,000–120,000), `lines[]` (≤30 lines, ≤200 chars each), and optional `source_from {song_id, range{start_ms,end_ms}, negative_ranges}` for inpainting.
- **v2/v2.5 `CompositionPlan`:** `chunks[]`. Each chunk is either:
  - a **generation chunk**: `text` (e.g. "[Verse 1]" plus lyrics plus `{inline directions}`), `duration_ms` (3–120 s), `positive_styles[]`, `negative_styles[]`, `context_adherence` (low/…/high), `conditioning_ref {song_id, range}`, `condition_strength`; or
  - an **audio reference chunk**, which keeps a stored song slice unchanged (inpainting).

---

### 12. Image & Video

- **Location:** Image & Video (`/app/image-video`).
- **Plans:** Free users can generate **images only**, up to **3 requests per day**. Video needs a paid plan.
- **US restrictions:** some models and uploads are restricted in the US; for example, **Seedance 2.0 is not available in the US**. Enterprise admins must enable models, which are **all disabled by default**. ByteDance models need approval for API use.
- **Tabs:** **Explore**, **Generate**, **History**, **Export**.
  - **Explore**:
    - Community gallery with a search bar and a **Trending / Newest** toggle.
    - Click a tile to see its prompt and settings.
    - Drag a tile into the prompt box to use it as a start frame, end frame, or style reference.
  - **Prompt box** (anchored at the bottom):
    - **Image / Video** toggle (upper right).
    - **Model menu**.
    - Settings: **Aspect Ratio**, **Resolution**, **Duration** (video), **Number of Generations** (up to 4).
    - Model-dependent controls: **Audio** toggle, **Negative Prompt**, **Sound Control**.
    - Reference slots: **Start Frame**, **End Frame**, **Image Refs**. Uploads accept JPG, PNG, WEBP, and more.
    - A **cost indicator** sits next to **Generate**.
  - **History**:
    - Inspect a generation's prompt, model, and settings.
    - Drag it back into the prompt box as a reference.
    - **Recreate**, **Share** (link), **Edit in Studio**, **Download**.
  - **Enhance**:
    - **Topaz Upscale**: factors 1/1.25/1.5/1.75/2/3/4x. Video can keep the source frame rate or convert to 24, 25, 30, 48, 50, or 60 fps.
    - **LipSync**: OmniHuman 1.5 animates an image from audio; Veed LipSync dubs an existing video.
    - **Background Removal**.
    - **Runway Ruby**: SDR to HDR, video up to 30 s.
- **Downloads:** MP4 (H.264/H.265, up to 4K with upscaling) and PNG.
- **Video models:**
  - Seedance 2.0 / 2.0 Fast / 2.0 Mini / 2.5 / 2.5 Edit / 2.5 Extend / 1.5 Pro / 1 Pro
  - Kling 3.0 / O3 / O3 Edit / O1 / O1 Edit / 2.6 / 2.5 / 2.6 & 3.0 Motion Control
  - Google Veo 3.1 / Fast / Lite
  - Gemini Omni Flash / 1.1 / 1.1 Extend
  - FLUX 3, MiniMax H3 / H3 Max
  - Runway Gen-4.5 / Gen-4 Turbo / Gen-4 Aleph / Aleph 2.0 / Act-Two
  - LTX Audio-to-Video / 2 Pro / 2 Retake / 2 Fast
  - Wan 3.0 / 3.0 Prime / 2.6 / 2.5
  - Example spec: Seedance 2.0 makes 4–15 s clips at 480p/720p/1080p in 21:9, 16:9, 4:3, 1:1, 3:4, or 9:16, with joint audio.
- **Image models:**
  - GPT Image 2.5 Sunburst / Flare / 2 / 1.5 / 1
  - Nano Banana 2 / 2 Lite / Pro / Nano Banana
  - Krea 2 Medium/Large
  - Recraft V4.1 / V4
  - Seedream 5 Lite/Pro / 4.5 / 4
  - Kling O1 Image, FLUX.2 [Pro], FLUX.1 Kontext [Pro]
  - Runway Gen-4 Image / Turbo
  - Wan 2.5 Image
- **Lip-sync models:** Creatify Aurora, Veed Fabric, HeyGen Avatar 4, Sync 3, Sync Lipsync 2 Pro, OmniHuman 1.5, Veed Lipsync / 2.0.
- **Avatars** (all paid plans):
  1. In the Avatar section, click **New**.
  2. Upload 3–5 reference images from different angles, or write a prompt.
  3. Set a name and a default voice, then click **Create Avatar**.
  4. Optionally add styles: **View Avatar**, then **New Style** (**Prompt it** or **Upload**).
  5. To make a video: **Create Lip Sync**, then choose a style, a voice, and a script. Click **Generate speech**, or pick one from TTS History, then **Use Speech**. Add an optional visual prompt and a model override, then click **Generate**.
  6. Avatars are also available as an **Avatar node** in **Flows**. There is no Avatar API at launch.
- **API (async; result delivered by webhook `flows_generation` or by polling):**
  - Images: `POST /v1/flows/image`, `GET /v1/flows/image/{generation_id}`, `GET /v1/flows/image`
  - Video: `POST /v1/flows/video`, `GET /v1/flows/video/{generation_id}`, `GET /v1/flows/video`
  - Status moves from `pending` to `generating` to `completed`/`failed`. Download from the `content_url`. Poll images at intervals of 2 s or more.
  - The workspace needs the Flows permission.
- **API model IDs:**
  - `bytedance-seedance-v2`, `-v2-fast`, `-v2-mini`, `bytedance-seedance-v2.5`
  - `veo-3.1-generate-001`, `veo-3.1-fast-generate-001`
  - `gpt-image-2.5-sunburst`, `gpt-image-2.5-flare`, `gpt-image-2`, `gpt-image-1.5`, `gpt-image-1`
  - `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`, `gemini-3-pro-image`, `gemini-2.5-flash-image`
  - `bytedance-seedream-5-lite`, `bytedance-seedream-5-pro`
  - `creatify-aurora`
  - All other models are app-only.

---

### 13. Forced Alignment

- **API only; there is no app UI.** It aligns known text to audio and returns word-level (and character-level) timestamps. Uses include subtitles and audiobook or ebook sync.
- **Limits:**
  - The capabilities page says **3 GB** per file; the API reference says less than 1 GB.
  - **10 hours** of audio.
  - **675,000 characters** of text.
- Send the text as a **plain string**. Diarization is not supported.
- Supports 29 languages.
- **Pricing:** same as Speech to Text.
- **API:** `POST /v1/forced-alignment` (multipart `file`, `text`). CLI: `elevenlabs forced-alignment create --file … --text …`.

---

### 14. Audio Native (embedded website player)

- **Location:** Audio Tools, then **Audio Native** (`/app/audio-native`). Requires the **Creator plan or higher**.
- **Setup:**
  1. Configure the player appearance: **background color** and **text color**.
  2. Add allowed sites to the **URL allowlist** (a single page or a whole domain). Pages that aren't on the list won't play.
  3. Copy the **embed code**.
- **Settings tab:**
  - **Voice** and **Model** selection.
  - **Pronunciation dictionaries**: phoneme or alias rules; the first match wins.
- **Listener dashboard:** built-in engagement metrics.
- **Updating:**
  1. On the Audio Native page, click **⋯**, then **Edit Audio**. This opens the Studio project.
  2. Make your edits.
  3. **Export** to MP3. This step is required.
  4. Go to **Export > Publish > Audio Native**, then **Published version**, and select the new export.
  - To change the title or author: in the Studio project, go to **☰**, then **Project Settings**, then the **Export** tab, and edit **Title / Author**.
- **Embed snippet:** a `div#elevenlabs-audionative-widget` with `data-height` (90 small / 120 large), `data-width`, `data-publicuserid`, `data-projectid`, and `data-playerurl="https://elevenlabs.io/player/index.html"`, plus `<script src="https://elevenlabs.io/player/audioNativeHelper.js">`.
- **Integration guides:** React/Next.js, Ghost, Squarespace, Framer, Webflow, WordPress, Wix.
- **API:**
  - `POST /v1/audio-native`: `name`, `title`, `author`, `voice_id`, `model_id`, `text_color`, `background_color`, `file` (txt/HTML), `auto_convert`, `apply_text_normalization` (auto/on/apply_english/off), `pronunciation_dictionary_locators`. Deprecated: `image`, `small`, `sessionization`. Returns `html_snippet`.
  - `POST /v1/audio-native/{project_id}/content` (update content)
  - `POST /v1/audio-native/content` (update from URL)
  - `GET /v1/audio-native/{project_id}/settings`

---

### 15. Unverified / conflicting items

1. **Payout rates:** the docs say only that the default rate is set by the notice period. I found no published $/1K-character figures.
2. **Iconic Marketplace:** no in-app UI, pricing, form fields, or API documented. The catalog list comes from the public marketing page; the launch date and partner come from third-party press.
3. **Music max duration:** 5 minutes on the capabilities page vs **10 minutes** in the product FAQ and the API (600,000 ms).
4. **Audio Reference plan availability:** "all paid plans" in several places vs "all Music v2 and v2.5 plans, including Free" in one place.
5. **Remixing Voice Library voices:** the remix page allows voices with an infinite notice period; the TTS guide says Library voices can't be remixed.
6. **SFX duration minimum:** 0.1 s on the overview page vs 0.5 s in the API.
7. **Forced Alignment max file size:** 3 GB on the capabilities page vs <1 GB in the API reference.
8. **PVC fine-tuning time:** 3–6 hours in most places vs "6–24 hours" in one status FAQ.
9. **Voice Changer speed slider, and the exact UI layout of the Voice Design and Voice Library pages:** described only in text. I didn't verify against the live app (no login).
10. **Music v2 as UI default "since May 2026", and SFX v2 launched "Sept 2025":** both dates come from third-party sources.
11. **Stem separation `stem_variation_id` enum values:** not shown in the API reference text I retrieved.

---

### Sources

- https://elevenlabs.io/docs/llms.txt
- https://elevenlabs.io/docs/overview/capabilities/voices
- https://elevenlabs.io/docs/overview/capabilities/voice-remixing
- https://elevenlabs.io/docs/eleven-creative/voices/voice-library
- https://elevenlabs.io/docs/help-center/product/voices/voice-library
- https://elevenlabs.io/docs/eleven-creative/voices/payouts
- https://elevenlabs.io/docs/eleven-creative/voices/voice-design
- https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning
- https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning
- https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning
- https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech
- https://elevenlabs.io/docs/overview/capabilities/voice-changer
- https://elevenlabs.io/docs/eleven-creative/playground/voice-changer
- https://elevenlabs.io/docs/overview/capabilities/voice-isolator
- https://elevenlabs.io/docs/eleven-creative/audio-tools/voice-isolator
- https://elevenlabs.io/docs/overview/capabilities/sound-effects
- https://elevenlabs.io/docs/eleven-creative/playground/sound-effects
- https://elevenlabs.io/docs/overview/capabilities/music
- https://elevenlabs.io/docs/overview/capabilities/music/best-practices
- https://elevenlabs.io/docs/overview/capabilities/music/marketplace
- https://elevenlabs.io/docs/eleven-creative/products/music
- https://elevenlabs.io/docs/eleven-creative/products/music/finetunes
- https://elevenlabs.io/docs/eleven-api/guides/cookbooks/music
- https://elevenlabs.io/docs/eleven-api/guides/how-to/music/inpainting
- https://elevenlabs.io/docs/overview/capabilities/image-video
- https://elevenlabs.io/docs/overview/capabilities/image-video/avatars
- https://elevenlabs.io/docs/eleven-creative/playground/image-video
- https://elevenlabs.io/docs/eleven-api/guides/cookbooks/image-and-video
- https://elevenlabs.io/docs/overview/capabilities/forced-alignment
- https://elevenlabs.io/docs/eleven-api/guides/cookbooks/forced-alignment
- https://elevenlabs.io/docs/eleven-creative/audio-tools/audio-native
- https://elevenlabs.io/docs/eleven-creative/audio-tools/audio-native/react
- API reference (each also available as `.md`): https://elevenlabs.io/docs/api-reference/voices/search, /voices/get, /voices/ivc/create, /voices/pvc/create, /voices/pvc/train, /voices/pvc/verification/captcha, /voices/pvc/verification/captcha/verify, /voices/pvc/samples/create, /voices/voice-library/get-shared, /voices/voice-library/share, /voices/find-similar-voices, /voices/collections/*, /text-to-voice/design, /text-to-voice/create, /text-to-voice/remix, /text-to-voice/stream, /speech-to-speech/convert, /speech-to-speech/stream, /audio-isolation/convert, /text-to-sound-effects/convert, /music/compose, /music/compose-detailed, /music/stream, /music/create-composition-plan, /music/upload, /music/separate-stems, /music/video-to-music, /music/finetunes/*, /flows/image/*, /flows/video/*, /forced-alignment/create, /audio-native/create, /audio-native/update, /audio-native/get-settings
- https://elevenlabs.io/iconic-marketplace
- https://the-decoder.com/elevenlabs-opens-a-marketplace-for-iconic-ai-voices/ (third-party)
- https://alternativeto.net/news/2025/11/elevenlabs-launches-a-new-iconic-marketplace-for-licensing-ai-generated-celebrity-voices/ (third-party)
- https://the-decoder.com/elevenlabs-releases-version-2-of-its-ai-sound-effects-model-with-longer-clips-and-better-audio-quality/ (third-party)
- https://www.all-ai.de/news/top-news24/elevenlabs-sfx-v2 (third-party)
- https://yespress.io/products/elevenlabs.md (third-party; dated 2026 release list)


---

# PART 3
## ElevenLabs Agents Platform (now "ElevenAgents"), research as of 2026-10-10

> **Naming and URLs.** The product was called "Conversational AI", then "Agents Platform", and is now **ElevenAgents**. Docs moved from `/docs/conversational-ai/...` to `/docs/agents-platform/...` and now to **`/docs/eleven-agents/...`**. The old paths still redirect. The dashboard is at `https://elevenlabs.io/app/agents`. API paths still use the `convai` prefix, e.g. `/v1/convai/agents/create`.
>
> **Method.** I pulled every ElevenAgents docs page (about 120 non-API pages) as markdown through `elevenlabs.io/docs/llms.txt`. I also read the Create-agent API schema, the changelog from June to October 2026, the help center, and the pricing page.
>
> **Verification.** Items marked **[Unverified]** come from third-party sources, screenshots I could not see, or docs that contradict each other. The docs describe the UI in prose. They don't give a complete click-by-click map, so the per-tab layout below is pieced together from many pages.

---

### 1. Architecture and core concepts

ElevenAgents coordinates four components:

1. **ASR / Speech-to-Text**: a fine-tuned STT model. The default provider is now `scribe_realtime` (Scribe v2 Realtime); `scribe_v2_turbo` is also available and `elevenlabs` is deprecated.
2. **LLM**: any supported model or a custom one (see §4).
3. **TTS**: low latency, 5k+ voices, 70+ languages. The default model is now `eleven_v4_turbo` (changelog 2026-10-05).
4. **Proprietary turn-taking model**: `turn_v3` is the default and `turn_v2` is still selectable.

Ways to manage agents:
- The dashboard
- The REST API and SDKs
- The **ElevenLabs CLI** ("agents as code")
- The **hosted MCP server**, for managing agents from Claude or other MCP clients
- **ElevenAgents Architect**, the in-app AI assistant (alpha)

Channels: web widget, SDKs (JS, React, React Native, Python, Swift, Kotlin), raw WebSocket and WebRTC, Twilio, SIP trunk, Exotel, Plivo, Telnyx, Vonage, Bandwidth and Sinch (telephony guides), WhatsApp (messages and calls), Twilio SMS, Slack, Zendesk, Microsoft Teams, Genesys, Amazon Connect and Five9.

---

### 2. Dashboard navigation (workspace level)

| Area | URL / location | Purpose |
|---|---|---|
| Agents list | `/app/agents/agents` | Create, open, duplicate and delete agents |
| Knowledge Base | `/app/agents/knowledge-base` | Workspace document library: **Add document** (File / URL / Text), folders, crawl, auto-sync |
| Integrations (MCP + native) | `/app/agents/integrations` | **Add Custom MCP Server** plus native integrations (Cal.com, Calendly, HubSpot, Salesforce, Zendesk, Slack, Jira, ServiceNow, Google Calendar/Drive, Intercom, Freshdesk, Exa, Tavily, Perplexity, Parallel, Telegram, Twilio, etc.) |
| Phone Numbers | `/app/agents/phone-numbers` | **Import number** → Twilio / From SIP Trunk / Exotel etc.; **Assign Agent**; **Outbound call** button |
| Batch calling / Outbound | `/app/agents/batch-calling` | **Create a batch call** |
| Conversation history ("Call history") | `/app/agents/history` | Transcripts, audio, evaluation, data collection, search (Keyword / Smart search) |
| Analytics | Analytics tab | Metrics, filters, grouping, Workflow analytics overlay |
| Spotlight | — | Real-time insights, sentiment, topic discovery; **Analyze with Architect** / **Investigate with Architect** buttons |
| Users | — | End users by `user_id` |
| Triage | per agent / workspace | Tickets from "Flag issue for review", manual and review sources |
| Agents Settings | `/app/agents/settings` | Workspace-level post-call webhooks, conversation-initiation webhook URL and secrets, **Code Tool Network Access** (admin only) |
| Developers → Environment Variables / Webhooks | — | Per-environment variables (`{{system__env_<label>}}`), workspace webhooks |

---

### 3. Creating an agent and templates

- **Dashboard:** go to the agents page, click create, enter a **name**, and choose a template. The quickstart uses the **`Blank template`**.
- **Templates (dashboard):** "ElevenLabs Agent Templates" launched around **April 30, 2026**, with **50+ use-case templates** across Support, Sales (AI SDR), Ops and Enablement. Examples include a help-center support agent, an SDR lead-qualification agent, a GTM training agent and a role-play coach. **[Unverified: from a Product Hunt listing; the official docs don't list the template names.]**
- **CLI templates** (official): `default`, `minimal`, `voice-only`, `text-only`, `customer-service` (temperature 0.1, 30-minute duration, evaluation criteria) and `assistant` (temperature 0.3). Commands: `elevenlabs agents templates list` and `elevenlabs agents templates show <template>`.
- **Creating via the API:** `POST /v1/convai/agents/create` with `conversation_config`, `platform_settings`, `workflow`, `name` and `tags`. All agents are now versioned, and `enable_versioning` is deprecated.
- **Defaults on new dashboard agents:**
  - The **End call** system tool is added automatically. API-created agents must add it explicitly.
  - Call queueing is on.
  - Bursting is on in the API default.
- **Testing in the dashboard:** the **Test AI agent** button (also called Preview) uses the React SDK under the hood. Conversation-initiation webhooks do not fire in Preview. Use the Dynamic Variables placeholders instead.

---

### 4. Agent editor: tabs and settings

The docs refer to these tabs and panels: **Agent**, **Voice** (also called "Agent Voice" or "Voice Settings"), **Workflow**, **Procedures**, **Knowledge Base** (section), **Tools** (tab/section), **Analysis**, **Tests**, **Security**, **Advanced**, **Widget** (also "Channels → Widget → Interface"), **Branches** (with **Proposals** sub-tab) / **Versioning**, **Settings**, and in some workspaces an **Architect** tab. Saving uses **Publish**, which creates a new version. Unsaved edits are kept as a per-user, per-branch **draft**.

**[Unverified]** The exact tab order and labels. Docs use slightly different names over time (for example "Voice" and "Agent Voice", "Channels → Widget" and "Widget tab"). Some features, such as RAG settings, are described as living on both the Knowledge Base section and the Advanced tab.

#### 4.1 Agent tab

| Setting | UI control | Details / API field |
|---|---|---|
| **Agent language** (primary) | Dropdown | `conversation_config.agent.language` (default `en`). Used for ASR and TTS. |
| **Additional Languages** | Multi-select dropdown, including an **All** option (31 languages, which the docs say cover ~90% of the world's population) | `conversation_config.language_presets`. The first message is auto-translated by an LLM per language and can be edited. Each preset can override the first message and other config. With additional languages the widget shows a language picker before the call. |
| **Hinglish mode** | Toggle (Hindi only) | `agent.hinglish_mode` |
| **First message** | Text area | `agent.first_message`. If empty, the agent waits for the user. Supports `{{dynamic_variables}}`. |
| Disable interruptions during first message | Toggle | `agent.disable_first_message_interruptions` |
| **System prompt** | Large text area | `agent.prompt.prompt`. Supports `{{vars}}`. The docs say models give the `# Guardrails` heading extra weight. Max system prompt size is **2 MB**, including knowledge base content. |
| **Default personality** | Toggle (inside **Agent behavior** panel) | `prompt.ignore_default_personality`. Removes built-in style lines such as "helpful, concise, ask clarifying questions". |
| **Agent behavior → Text channels** | Per-channel expanders: **Verbosity** (Auto / Concise / Thorough), **Output format** (Plain text / Markdown), **Response time** (Realtime / 5 min / 10 min / 1 hour) | `agent.text_behavior_overrides`. Voice is unaffected. Slack defaults to thorough + Markdown; the widget defaults to plain + realtime. |
| **Timezone** | Field | `prompt.timezone`. Injects the current time into the prompt. |
| **LLM** (Primary LLM) | Dropdown/modal. Includes a **"Hosted by ElevenLabs"** label, a **Custom LLM** option and a **Detailed costs** button that shows the estimated LLM cost per agent. | `prompt.llm`. See the LLM table below. |
| **Temperature** | Slider | `prompt.temperature` (API default 0; `null` omits it). Guide: 0–0.3 deterministic, 0.4–0.7 balanced, 0.8–1.0 creative. |
| **Limit token usage / Max tokens** | Number | `prompt.max_tokens` (default `-1` = unlimited). The custom-LLM guide uses "Limit token usage = 5000". |
| **Thinking budget** | Numeric slider | `prompt.thinking_budget` (0 disables it where the model allows) |
| **Reasoning effort** | Dropdown | `prompt.reasoning_effort`: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` (availability depends on the model) |
| **Reasoning summary** | Toggle (off by default) | `prompt.enable_reasoning_summary`. Shown under a "Reasoning" badge in history. Not compatible with ZRM. Adds latency. |
| **Backup LLM** | Radio: **Default** / **Custom** (ordered list) / **Disabled** | `prompt.backup_llm_config.preference` = `default` / `override` + `order` / `disabled`. `cascade_timeout_seconds` defaults to **4 s** (range 2–15). |
| **Parallel tool calls** | Toggle | `prompt.enable_parallel_tool_calls` (default true) |
| **Turn eagerness** | Selector: **Eager / Normal / Patient** | `turn.turn_eagerness` (default `normal`) |
| **Knowledge base** | **Add document** button; **Use RAG** toggle | See §6 |
| **Tools** | **Add Tool** button. Tool Type: **Webhook / Client / Code / System**, plus MCP servers. | See §7 |
| **Workspace Auth Connections** | **Add Auth** button | OAuth2 Client Credentials, OAuth2 JWT, Basic. Used by tools. |
| **Dynamic Variables** placeholders | Key/value list | `agent.dynamic_variables.dynamic_variable_placeholders`. Test-only defaults. |
| **Voices** + **Audio environment** button | Button next to "Voices" on the Agent page | Background sound and voice filter (see §5) |

**Supported LLMs** (official docs, Oct 2026)

| Provider | Models |
|---|---|
| ElevenLabs-hosted | DeepSeek Flash 4.1, GLM 5.2, Qwen3.6-35B-A3B, Qwen3.5-397B-A17B |
| Google | Gemini 3.8 Flash, 3.7 Flash, 3.6 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Pro Preview, 3.1 Flash Lite, 3 Flash Preview, 2.5 Flash, 2.5 Flash Lite |
| OpenAI | GPT-6.1 Sol, GPT-6 Astra, GPT-6 Sol, GPT-6 Luna, GPT-5.6 Sol/Terra/Luna, GPT-5.5, GPT-5.4 (+Mini, Nano), GPT-5.2, GPT-5.1, GPT-5 (+Mini, Nano), GPT-4.1 (+Mini, Nano), GPT-4o, GPT-4o Mini |
| Anthropic | Claude Opus 5.5, Opus 5, Opus 4.8, Opus 4.7, Sonnet 5.5, Sonnet 5, Sonnet 4.6, Sonnet 4.5, Haiku 4.5 |
| Custom | `custom-llm`: OpenAI-compatible **Chat Completions** (`/v1/chat/completions`) or **Responses** (`/v1/responses`) over SSE. A **websocket** custom-LLM API type was added Aug 2026. |

- **Legacy and pinned identifiers.** The API enum also accepts legacy and pinned IDs: `gemini-2.0-flash`, `claude-3-5-sonnet`, `gpt-oss-20b/120b`, `qwen3-4b`, `qwen3-30b-a3b`, `glm-45-air-fp8`, `watt-tool-8b/70b`, `grok-beta` and dated snapshots.
- **Prompting-guide picks:**
  - **GLM 5.2 or GPT-6 Luna** as the general starting point.
  - **DeepSeek Flash 4.1 or Gemini 3.5 Flash-Lite** for ultra-low latency.
  - **Claude Sonnet 5.5** for complex reasoning.
  - The tools docs recommend "GPT 6 or Claude Sonnet 5.5" for tool use.
- **Default backup cascade (subject to change):** Gemini 2.5 Flash → GPT-4o → Gemini 2.5 Flash Lite → Claude Sonnet 4.5. At least 3 retries. A custom LLM retries only itself. HIPAA/ZRM agents filter the cascade to compliant models.
- **Custom LLM setup:**
  1. Choose LLM dropdown → **Custom LLM**.
  2. Enter the **Server URL** and **Model ID**.
  3. Under **API key**, choose **Create new secret** (e.g. `OPENAI_API_KEY`) and click **Add secret**.
  4. Close the modal and click **Publish**.

  Optional features: extra body parameters (`custom_llm_extra_body` override), "buffer words" (end a chunk with `"... "`) for slow models, and system tools exposed as OpenAI function definitions.

#### 4.2 Voice tab

| Setting | Control | Field / notes |
|---|---|---|
| **Voice** | Voice picker from the Voice Library (5k+ voices) | `tts.voice_id`. Voices with live moderation can't be used. |
| **TTS model** | Dropdown | `tts.model_id`: `eleven_v4_turbo` (new default), `eleven_v4`, `eleven_v3_conversational` (**V3 Conversational**), `eleven_flash_v2`, `eleven_flash_v2_5`, `eleven_turbo_v2`, `eleven_turbo_v2_5`, `eleven_multilingual_v2` |
| **Expressive mode** | Toggle (on by default with v3) | `tts.expressive_mode`. The LLM can emit tags such as `[laughs] [whispers] [sighs] [slow] [excited]`, each affecting about 4–5 words. `suggested_audio_tags` sets a preferred list. V3 Conversational does **not** preserve PVC voice characteristics. |
| **Stability** | Slider | `tts.stability` (default 0.5) |
| **Similarity boost** | Slider | `tts.similarity_boost` (default 0.8) |
| **Speed** | Slider, **0.7–1.2** | `tts.speed` (default 1.0) |
| **Output audio format** | Dropdown | `tts.agent_output_audio_format`: `pcm_8000/16000/22050/24000/44100/48000` or `ulaw_8000` ("μ-law 8000 Hz", needed for Twilio register-call) |
| **Text normalisation** | Dropdown | `system_prompt` (default; adds instructions to the prompt) or `elevenlabs` (post-generation, a little more latency) |
| **Pronunciation dictionaries** | Upload/attach `.pls` files (IPA or CMU) | `tts.pronunciation_dictionary_locators`. Phoneme tags work only on `eleven_v4`, `eleven_flash_v2` and `eleven_v3`; other models need alias tags. `enable_phoneme_tags` defaults to true. |
| **Multi-voice support** | Section with an **Add voice** button. Each entry has **Voice label**, **Voice**, **Model family** (Same as agent / Flash / Turbo / Multilingual / v3 conversational / v4 / v4 turbo), **Language** and **Description**. | `tts.supported_voices`. Maximum **10 voices** including the default. The LLM switches voices with `<VOICE_LABEL>…</VOICE_LABEL>` tags. Tags are case-sensitive and can't be nested. |
| **Language-specific voices** | Per additional language: a voice and settings | Through `language_presets` |
| **Audio effects** | **[Unverified UI]** | `tts.audio_effects`: filter preset (`phone`, `old_radio`), `distance`, reverb `environment_id`, `background_noise_id` and `send_level`. The list comes from `GET /v1/audio-effects/catalog`. |
| **Audio environment** panel | **Enable background sound** toggle; **Background sound** dropdown (office1, office2, restaurant, city, typing, elevator1–4) with a ▶ preview; **Volume** (0.01–1.0, default 0.15); **Crossfade loop** (default on); **Voice filter** (Off or phone presets, dashboard only) | `conversation.background_sound`. Hidden for text-only agents. Can't be overridden per conversation, but can be set per workflow node. |

#### 4.3 Workflow tab (visual multi-agent / subagent builder)

The **Workflow** tab is a visual graph editor. The config is stored in the top-level `workflow` object, where `nodes` and `edges` are keyed by ID.

**Node types**
- **Start node.**
- **Subagent (override agent) node.** Overrides or appends settings at that phase of the conversation:
  - **General:** system prompt (append or override), LLM, voice and voice settings.
  - **Knowledge Base:** **Include Global Knowledge Base** toggle and additional documents.
  - **Tools:** **Include Global Tools** toggle and additional tools.
  - **Entry behavior:** `generate_immediately` / `wait_for_user` / `auto`.
  - Per-node overrides for turn, ASR, RAG, background sound, etc.
- **Say node.** **Literal** mode (exact text, with an optional translation per language) or **Prompt** mode (generated by the LLM).
- **Dispatch tool node.** Guarantees a tool call. Has **Success path** and **Failure path** edges.
- **Update state node.** Assigns dynamic variables using expressions.
- **Agent transfer node.** Can target a specific `node_id` in another agent's workflow. Supports nested push, pop and replace transfers (`enable_nesting`, `return_when_nested`) and `preserve_voice_settings`.
- **Transfer to number node.** Supports UUI for SIP REFER.
- **End node.**

**Edges.** Forward or backward (loops). Conditions:
- **LLM Condition**: a **Label** plus a natural-language **LLM Condition**.
- **Expression**: deterministic, over variables.
- **None**: unconditional.

**Analytics overlay.** Shows Entries, Avg time spent, Terminations and in/out flow per node. **See conversations** opens history with the **Node entered** filter applied.

The client can choose the starting node if `enable_starting_workflow_node_id_from_client` is on.

#### 4.4 Procedures tab (new in 2026)

- **Purpose:** task-specific instruction sets the agent loads when a **Trigger** matches. Create one with the **+** menu (free-form or structured, plus folders).
- **Free-form procedures:**
  - Natural-language **Name**, **Trigger** and **Content**.
  - Inline references to other procedures, tools and knowledge base documents.
  - Sub-procedures have an empty trigger.
  - Can be imported from a document.
- **Structured procedures:** ordered typed steps:
  - **Ask** (the only step that waits for the user)
  - **Tell**
  - **Say** (exact text, with translations)
  - **Tool** (parameters set by `constant` / `dynamic_variable` / `llm` / `omit`, with a failure handler)
  - **If / Else if / Else**
  - **Sub-procedure**
  - **System tool** (only end call)
  - **Retry** (up to 3, inside a failure handler)

  Since 2026-10-05 they compile automatically on save and publish.
- **Limits:**
  - 50,000 characters per procedure.
  - The 5 most recently started procedures stay in context.
  - The type can't be changed after creation.
  - Procedures belong to one agent and aren't shared.
  - Structured procedures can't reference knowledge base documents.
  - All procedures are available from every workflow node.

#### 4.5 Analysis tab

- **Evaluation criteria:**
  - **Add criteria** button. Fields: **Identifier** and **Description** (the goal prompt).
  - Results are `success` / `failure` / `unknown` with a rationale.
  - **30 per agent.**
  - API extras:
    - `scoring_mode` `binary` or `numeric_uniform`, with `max_score` and `score_instructions`
    - per-criterion `llm`
    - `use_knowledge_base`
    - `scope` `conversation` / `agent`
- **Data collection:**
  - **Add item**. Fields: **Data type** (string / boolean / integer / number), **Identifier** and **Description**.
  - **25 per agent**, or 40 on Trial and Enterprise.
  - API extras: `enum`, `allowed_values`, per-item `llm`, `data_collection_scopes`.
- **Sentiment analysis** toggle and **Topic discovery** toggle. Both feed Spotlight. Sentiment trajectory is shown per conversation.
- **Analysis LLM** (`platform_settings.analysis_llm`), **Summary language** and **Auto-translate transcript to app language** (`auto_translate_transcript_to_app_language`). **[UI placement unverified]**
- **Re-running analysis.** Analysis can be re-run with `POST .../analysis/run`, and one criterion with `.../evaluations/run`.

#### 4.6 Tests tab

- **Test types:**
  - **Simulation**: scenario, success condition(s) (up to 30), and **max turns** (1–50, default 5).
  - **Next Reply (Scenario)**: chat history, success criteria, and success and failure examples.
  - **Tool Call**: expected tool and parameters. Validation by **Exact Match**, **Regex Pattern** or **LLM Evaluation**.
- **Optional settings:** **Environment** selector, **Chat history** (start mid-conversation), **Dynamic variables**.
- **Tool mocking:** **Mock none / Mock all tools / Mock selected tools**. The fallback when no mock matches is **Call real tool** or **Finish with error**. System and workflow tools are never mocked. Per-test `tool_mock_overrides` and `is_error` mocks are available.
- **Running tests:** run single tests, a multi-selection, or **Run All Tests**. The split-run control repeats a run (e.g. 3×, 5×, 15×). The API's `repeat_count` accepts up to 50.
  - Pass-rate badges: **Green** 100%, **Amber** ≥80%, **Red** <80%.
  - Failures are bucketed by reason.
- **Creating tests from history:** **Create test from this conversation** in call history.
- **Other surfaces:** the CLI and API (`/v1/convai/tests`, `run-tests`). The old `simulate-conversation` endpoints are **deprecated**.

#### 4.7 Security tab

- **Authentication:**
  - **Enable authentication** (signed URLs or conversation tokens) is `platform_settings.auth.enable_auth`.
  - **Allowlist**: up to **10 hostnames**, exact match, e.g. `example.com`, `localhost:3000`.
  - **Require origin header**.
  - The docs say to use one method (signed URL or allowlist), not both.
  - Signed URLs expire after **15 minutes** for initiation, but sessions can run longer. WebRTC conversation tokens last **10 minutes** (per the Kotlin docs).
- **Overrides** (toggles per field; off by default): System prompt, First message, Language, Voice ID, LLM, Tools, Knowledge base, Text-only mode, Stability, Speed, Similarity boost, **ASR keywords** (soft-disallow, max 50), TTS `model_id`, `max_duration_seconds`, pronunciation dictionaries, soft-timeout message.
  - **Fetch initiation client data from a webhook** (conversation-initiation webhook). The response must be ≤256 KB.
  - Allow `starting_workflow_node_id` and `procedure_ids` from the client.
- **Limits:**
  - **Concurrency limit** (`agent_concurrency_limit`, -1 = none).
  - **Daily limit** (default 100,000).
  - **Enable bursting** toggle.
  - **Enable call queuing** (default on). **Max queue wait time** is 1–1,800 s (default 180). **Custom hold audio** accepts MP3 or WAV up to 40 MB and 3 minutes. Queue time is not billed.
- **Guardrails (Guardrails 2.0)** **[tab placement unverified; config is `platform_settings.guardrails`]**:

  | Guardrail | Layer | Status |
  |---|---|---|
  | **Focus** | System prompt hardening | GA |
  | **Manipulation** (prompt injection) | Input validation; terminates the conversation | GA |
  | **Content** | Response validation | Alpha |
  | **Custom** | Name, Prompt, Execution mode (`streaming` / `blocking`, +200–500 ms), Trigger action (`end_call` / `retry`, up to 3 retries with feedback templates using `{{trigger_reason}}` / `{{agent_message}}`) | Alpha |

#### 4.8 Advanced tab

| Setting | Notes |
|---|---|
| **Max conversation duration** (under **Call limits**) | 60–7,200 s, default 600. `max_conversation_duration_message`. |
| **Take turn after silence** (turn timeout) | 1–30 s. The API default is 7. `initial_wait_time` applies when the first message is empty. |
| **Silence end-call timeout** | `turn.silence_end_call_timeout` (-1 = off) |
| **Soft timeout** | Timeout 0.5–8 s (default -1 = off, 3 s recommended). Static message (default "Hhmmmm...yeah.", 1–200 chars). Additional messages (up to 7). Max per generation (1–8). Randomize fillers. **LLM-generated message** toggle with prompt override. "Disable until first user message". |
| **Client events** | Multi-select: `audio`, `interruption` (**selecting this enables user interruptions**), `user_transcript`, `tentative_user_transcript`, `agent_response`, `agent_response_correction`, `agent_chat_response_part`, `agent_response_complete`, `agent_tool_response(_full_payload)`, `client_tool_call`, `mcp_tool_call`, `vad_score`, `guardrail_triggered`, `context_usage`, etc. |
| Interruption fine-tuning | `interruption_ignore_terms` (e.g. "gotcha"), `merge_with_default_ignore_terms`, `transcribe_on_disabled_interruptions` |
| Turn extras | `spelling_patience` (auto/off), `speculative_turn` (lower latency, higher LLM cost), `retranscribe_on_turn_timeout`, `turn_model` (v2/v3), VAD `background_voice_detection` |
| **ASR** | Provider, quality, **user input audio format** (pcm 8k–48k / μ-law 8000), **Keywords** (boost terms) |
| **Text only** toggle | `conversation.text_only` (chat mode; 25× higher concurrency pool) |
| **Multimodal input** | **Allow file attachments** (images and PDFs if the model supports them). **Files kept in memory** (1–10, or up to 30 per the changelog). **Max files per conversation** (-1 = unlimited, billed per file). **Enable DTMF input** with **DTMF input timeout** (0.5–10 s, default 2), **Use # to complete DTMF input**, **Redact DTMF input**. |
| **RAG configuration** | Embedding model (`e5_mistral_7b_instruct` or `multilingual_e5_large_instruct`), max document chunks (20), max vector distance (0.6), max documents length (50,000), `num_candidates`, query-rewrite prompt override |
| **Source attribution** | `conversation.source_attribution` (report which knowledge base sources were used) |
| **Monitoring** toggle + events | Enables a live WebSocket at `wss://api.elevenlabs.io/v1/convai/conversations/{id}/monitor`. Control commands: end call, transfer, contextual update, **human takeover** / send message as human. |
| **Privacy** | **Audio saving** toggle (`record_voice`). **Data Retention** in days (UI docs say the default is 2 years; API default -1 = unlimited; 0 = immediate/scheduled deletion) with "apply to existing data". **Zero Retention Mode** toggle. **Conversation history redaction** (Enterprise): entities such as `name`, `email_address`, `contact_number`, `dob`, ..., with `excluded_data_collection_ids`. |
| **Agent-level webhooks** | Post-call webhook override, "Send audio data" toggle, `exclude_transcript`, OpenTelemetry transcript option |

#### 4.9 Widget tab (Channels → Widget)

- **Interface (modality):** **Voice only** (default), **Voice + text**, **Chat Mode** (text-only).
  - Toggles: mic muting, transcript, text input, conversation-mode toggle, language selector, show agent status, show conversation ID, strip audio tags, resize button, default/always expanded, dismissible.
- **Appearance:**
  - Variant `tiny` / `compact` / `full` / `expandable`.
  - Placement: top-left, top, top-right, bottom-left, bottom, bottom-right.
  - Expandable: never / mobile / desktop / always.
  - Colors: bg, text, btn, btn text, border, focus.
  - Border and button radius.
- **Avatar:** **Orb** (two gradient colors), or **Link/image** (custom URL).
- **Feedback:** **None** / **During conversation** / **After conversation**.
- **Display text:** action text, start/end call text, expand text, listening/speaking text. File-upload labels and errors.
- **Terms:** Markdown terms content plus a **Local storage key** so returning users skip the prompt.
- **Language:** selector (requires additional languages on the agent).
- **Shareable page:** description text and show-terms option. Public talk-to links accept `?vars=<base64 JSON>` or `?var_<name>=` (the `var_` form wins).
- **Embed code:**
  ```html
  <elevenlabs-convai agent-id="..."></elevenlabs-convai>
  <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async></script>
  ```
  - Attributes: `agent-id` / `signed-url`, `server-location`, `variant`, `dismissible`, `avatar-image-url`, `avatar-orb-color-1/2`, `action-text`, `start-call-text`, `end-call-text`, `expand-text`, `listening-text`, `speaking-text`, `markdown-link-allowed-hosts`, `markdown-link-include-www`, `markdown-link-allow-http`, `syntax-highlight-theme`, `dynamic-variables`, `override-*`.
  - The widget requires a **public agent (auth disabled)**. Use the allowlist for protection.
  - SDK and attribute settings override UI settings.
  - Client tools hook in through widget events, e.g. a `redirectToExternalURL` example.
  - No-code guides exist for Framer, Ghost, Squarespace, Webflow, Wix and WordPress.

#### 4.10 Branches / Versioning and Settings

- **Versioning:**
  - All agents are versioned (2026). Versions (`agtvrsn_…`) are immutable. Branches are `agtbrch_…`; **Main** can't be deleted. Drafts are per user and per branch.
  - **Create branch**, **Edit traffic split** (must total 100%; routing is deterministic by conversation ID), **See analytics** / **View Analytics**.
  - Merge with conflict resolution (most recent change wins; `force` takes the source). Rebase onto main. Archive (only at 0% traffic). Merge/rebase preview.
- **Merge proposals (alpha, Oct 2026):** **Open merge proposal** / **Create proposal**. Tabs: Overview, Changes (diff), Test runs, Conversations. Reviews are Approved or Changes requested; needs one non-author approval (admins exempt). Statuses: Open, Merged, Closed (withdrawn / rejected / branch_archived).
- **Per-agent (unversioned) settings:** name and tags, auth, call limits, privacy.
- **Experiments:** A/B testing built on branches. Compare CSAT, containment, conversion, AHT, latency and cost.

---

### 5. Language and multi-language

- Language support depends on the TTS model:
  - Flash and Turbo cover about 32 languages. The agent UI offers **31** under "All".
  - **Eleven v3 Conversational** and v4 support **70+** languages.
  - **Conflicting docs:** the language page says new agents default to "Flash v2" and English uses v2. The help center and API now say the default is **Eleven v4 Turbo**. Treat the language-page text as stale.
- **language_detection system tool:**
  - Switches language by `detection` (the user speaks another language) or `content` (the user asks to switch).
  - **Only at start of conversation** toggle (`only_at_conversation_start`) limits switching to the first 2 user turns.
- Language can also be fixed per call through the `language` override.
- The language page says the language selection is "fixed for the call" without the detection tool.

---

### 6. Knowledge base and RAG

- **Sources:** File (PDF, DOCX, TXT, MD, HTML, EPUB; ≤20 MB), URL (single page, **crawl whole site** or **sitemap**; crawler UA `ElevenlabsBot/1.0`, respects robots.txt), Text. Google Drive external sync is also available.
  - Inline editing regenerates chunks and embeddings.
  - URL docs have **Refresh** and **auto-sync**.
  - Folders are supported; attached folders are always used through RAG.
  - The **Dependent agents** tab lists users of a document; use force delete to detach it everywhere.
- **Usage mode per document:**
  - `auto` (default): RAG if enabled and indexed, otherwise full context.
  - `prompt`: always in the prompt.
- **Full-context limit:** about 300k characters per document. Documents under 500 bytes can't be indexed and go into the prompt.
- **Use RAG** toggle. Adds about **250 ms** latency.
- **RAG index quota by plan:**

  | Plan | RAG index quota |
  |---|---|
  | Free | 1 MB |
  | Starter | 2 MB |
  | Creator | 20 MB |
  | Pro | 100 MB |
  | Scale | 500 MB |
  | Business | 1 GB |
  | Enterprise | 1 GB+ |

- **Newer features:**
  - A `knowledge_base` system tool with search strategies (replacing legacy `knowledge_base_rag`).
  - A RAG query endpoint (`/agents/{id}/knowledge-base/rag-query`).
  - `source_url` on chunks.

---

### 7. Tools

**Common tool settings**
- **Name**, **Description**, **Parameters**:
  - Data type, Identifier, Required, Description.
  - Value type: **LLM Prompt** / **Dynamic variable** / constant / omitted.
  - Optional `enum` / `allowed_values`.
- **Response timeout**: 5–300 s for webhooks, default 20.
- **Execution mode**: `immediate` / `post_tool_speech` / `async`.
- **Pre-tool speech**: `auto` / `force` / `off`.
- **Tool error handling**: `auto` / `summarized` / `passthrough` / `hide`.
- **Interruptions** (under **Advanced settings**): **Allow** / **Disable during execution** / **Disable during whole turn**.
- **Tool Call Sound** dropdown: None / Typing / Elevator Music 1–4, with a ▶ preview. **Sound Behavior**: **With pre-speech** (`auto`) or **Always play**. Can be set per integration.
- **Dynamic variable assignments** from responses use dot paths, e.g. `response.users.0.email`.
- **Response filter**: trims responses before they reach the LLM.

| Type | Key details |
|---|---|
| **Webhook (server) tools** | Method; URL with `{path_params}`; Headers (static, **Secret** → **Create New Secret**, dynamic variable, env var); Path / Query / Body params; **Content Type** JSON or URL-encoded; auth via **Workspace Auth Connections** (OAuth2 Client Credentials, OAuth2 JWT (HS256 default, 3600 s), Basic, Bearer via secret header, custom headers, mTLS). Environment variables: `{{system__env_<label>}}`. |
| **Client tools** | Defined in the UI, registered in code with matching case-sensitive names. **Wait for response** checkbox (`expects_response`) so the result is fed back to the LLM. Can assign dynamic variables. |
| **Code tools** (Enterprise) | Sandboxed JavaScript `export default async (ctx) => {...}`. `ctx.args`, `ctx.config`, `ctx.secrets` and `ctx.auth_connections` are injected on egress only. **Context object** section. Editor tabs **Params** (Define Params) / **Output** / **Logs** with a **Run** button. Network is limited to the **Code Tool Network Access** allowlist (admin). Timeout 1–30 s. No npm packages. |
| **MCP servers** | Workspace opt-in: accept the MCP Server Terms dialog, or set `can_use_mcp_servers`. **Add Custom MCP Server** with **Name, Description, Server URL, Secret Token, HTTP Headers**, then **Add Integration** (tests and lists tools). Transports: SSE and streamable HTTP. Approval modes: **Always Ask** (recommended), **Fine-Grained Tool Approval** (per tool: Auto-approved / Requires approval / Disabled), **No Approval**. Not available with ZRM or HIPAA. `request_meta`; environment scoping. Not in the CLI. |
| **Native integrations** | Prebuilt `api_integration_webhook` tools (HubSpot, Salesforce, Zendesk, Cal.com, ...) |

**System tools** (`built_in_tools`; added from **Add tool**)

| Tool | Parameters / options |
|---|---|
| `end_call` | `reason` (req.), `message`. Added by default in the dashboard. |
| `language_detection` | `reason`, `language`. **Only at start of conversation** option. |
| `transfer_to_agent` ("Transfer to AI Agent") | Rules: **Agent**, **Condition**, **Delay before transfer (ms)**, **Transfer Message**, **Enable First Message**, optional `node_id`, `preserve_voice_settings`, `preserve_client_tts_overrides`. The parent passes client events, audio formats, language and analysis/webhook config to the child; everything else comes from the child. |
| `transfer_to_number` ("Transfer to Human"); phone calls only | Rules: **Transfer Type** (Conference default / Blind (Twilio native; set via **Edit as JSON**) / SIP REFER), **Number Type** (Phone E.164 / SIP URI), destination, **Condition**. Custom SIP REFER headers. **UUI** (SIP REFER to a SIP URI). **post_dial_digits** (`w`, `W`; Twilio native, conference/blind). Warm `agent_message` only on Twilio native. |
| `skip_turn` | `reason`. `wait_timeout_secs` (-1 = wait for the user). |
| `play_keypad_touch_tone` | `dtmf_tones` (0-9 * # w W). **Use out-of-band DTMF (RFC 4733)** checkbox (SIP only). |
| `voicemail_detection` | `reason`. Optional **Voicemail Message** with dynamic variables. Also Twilio AMD `twilio_machine_detection` (`enable` / `detect_message_end`). |
| **Update state** | Up to 50 state updates. Expressions: Constant, Dynamic variable, LLM-extracted value, and/or/if-then-else, comparisons, arithmetic. Each has a **Required** toggle. Dashboard only. |
| **Flag issue for review** (formerly "Request help") | Silently opens a triage ticket. Not available with ZRM or on-prem. |
| `start_procedure` / `end_procedure`, `knowledge_base` | Internal or procedure-related |

---

### 8. Personalization: dynamic variables, overrides, initiation webhook

- **Dynamic variables:** `{{var}}` in the prompt, first message, tool params and headers. Types: string, number, boolean.
  - **System variables:** `system__agent_id`, `system__current_agent_id`, `system__caller_id`, `system__called_number`, `system__call_duration_secs`, `system__time_utc`, `system__time`, `system__timezone`, `system__conversation_id`, `system__call_sid`, `system__call_id`, `system__agent_turns`, `system__current_agent_turns`, `system__current_subagent_turns`, `system__is_text_only`, `system__conversation_history`.
  - The `secret__` prefix keeps a variable out of the LLM; it is used only in headers and redacted later.
  - SIP `X-` headers map to `{{sip_<name>}}`.
- **Overrides:** must be enabled per field in Security. Passed as `conversation_config_override`. The docs prefer dynamic variables over overrides.
- **Conversation initiation webhook:** a POST to your server for inbound Twilio, SIP, Exotel, WhatsApp or SMS calls (and outbound calls without client data). It returns `conversation_initiation_client_data` (dynamic variables plus overrides).
- **Batch calling CSV columns** can override `language`, `first_message`, `system_prompt` and `voice_id`.

---

### 9. Conversation history, analytics, observability

- **Conversation history:**
  - Transcript, audio, evaluation, data collection, reasoning badge, **Phone Call** tab (SIP vars), wait time, cost (`cost_fiat`), file inputs.
  - **Create test from this conversation**.
  - Filters: time, duration, ratings, tools, languages, branch, version, node entered, dynamic variable (`name:op:value`), guardrails, termination reasons.
  - Search modes: **Keyword** (default) or **Smart search** (semantic). A query matching `conv_...` jumps straight to that conversation.
- **Analytics:**
  - Metrics: call count, total and avg duration, total and avg cost, response latency (p50/p90/p99), error rate and breakdown, success-evaluation rates, data collection, language breakdown, active calls.
  - Filters and grouping: Agent, Branch, Call type, Language, Source, LLM, TTS, ASR, Tool, Error, Evaluation.
  - Tabs include General, Tools, LLMs and Workflow.
- **Spotlight:** real-time insights, sentiment, topic discovery.
- **Users page:** user ID, last contact, agent, conversation count.
- **Triage queue:** Open / In progress / Resolved / Merged.
- **Alerting:** Slack, PagerDuty and webhook notifiers (Sep 2026). **[UI details unverified]**
- **OpenTelemetry traces:** available via post-call webhook, `GET conversation?format=opentelemetry`, or the monitoring WebSocket.

---

### 10. Post-call webhooks

- **Where to enable:** workspace-wide in **Agents Settings**, with per-agent overrides. Also listed under **Developers → Webhooks**.
- **Types:**
  - `post_call_transcription`: full data, analysis, metadata, dynamic variables, `branch_id`, `version_id`, `environment`.
  - `post_call_audio`: base64 MP3, chunked transfer, 5-minute timeout; toggled by **Send audio data**.
  - `call_initiation_failure`: busy / no-answer / unknown, with Twilio or SIP metadata.
  - Newer types: `unredacted_transcript`, `unredacted_audio`, `answering_machine_detection`.
- **Security:** HMAC via the `ElevenLabs-Signature` header (SDK `constructEvent` / `construct_event`) plus an IP allowlist.
- **Delivery rules:**
  - The endpoint must return 200.
  - Retries are optional.
  - The webhook is auto-disabled after 10+ consecutive failures if there has been no success in 7 days.
  - With ZRM, webhooks are the only way to get call data.

---

### 11. Phone numbers and telephony

#### Twilio (native)

- **Import:** **Import number** → enter Label, Phone Number, **Twilio SID** (Account SID or API Key `SK…`) and **Twilio Token**. ElevenLabs auto-configures the Twilio number.
  - Purchased numbers support inbound and outbound.
  - Verified caller IDs are outbound only.
- **Calls:** **Assign agent**; **Outbound call** → choose agent and number → **Send Test Call**.
- **Options:** SMS conversations (`enable_sms`), OTP verification, regional routing, Twilio call recording, AMD.
- **Register-call alternative:** `POST /v1/convai/twilio/register-call` returns TwiML.
  - Requires μ-law 8000 Hz in and out.
  - **No transfers**, and numbers don't show in the dashboard.

#### SIP trunk

- **Import:** **Import number** → **From SIP Trunk**.
  - **Label** and **Phone Number** (E.164; leading `+` must match the SIP URI).
  - **Inbound:** Media Encryption (Disabled / Allowed / Required), Allowed Numbers, Allowed Source IPs (TCP/TLS only), Remote Domains (TLS), digest username/password.
  - **Outbound:** Address (host only), Transport (TCP / TLS / UDP experimental), Media Encryption, **Enabled Codecs** (G.722, PCMU, PCMA), Custom Headers (**Add Header**), digest auth (otherwise ACL).
- **Endpoints:** `sip:<id>@sip.rtc.elevenlabs.io:5060;transport=tcp`, or `:5061;transport=tls`.
  - Static IP (Enterprise): `sip-static.rtc.elevenlabs.io` with a /24 block.
  - BYE headers can be set from dynamic variables (`attributes_to_headers`).
  - Requires TLS 1.2+.

#### Other channels

Exotel (first-class since June 2026), Plivo, Telnyx, Vonage, Bandwidth, Sinch, Amazon Connect, Five9, Genesys, Microsoft Teams and **WhatsApp**:
- WhatsApp has **Enable messaging**, **Enable audio message response** and **Enable typing indicator** settings. Calls and messages are both supported.
- WhatsApp has a 15-minute inactivity timeout for message conversations.

#### Batch calling

- **Create a batch call** → **Batch name**, **Phone number**, **Select agent**.
- **Upload** a CSV or XLS file. A `phone_number` column is required; other columns become dynamic variables or overrides. A template is downloadable.
- **Send immediately** or **Schedule for later** (date, time, timezone). **Test call**, then **Submit a Batch Call**.
- Concurrency used is the lower of 50% of workspace capacity and 70% of agent capacity.
- No ZRM.
- Export results as CSV, retry, or cancel.
- TCPA compliance note applies.

---

### 12. SDKs and real-time APIs

| SDK | Package | Notes |
|---|---|---|
| JavaScript | `@elevenlabs/client` | `Conversation.startSession({agentId \| signedUrl \| conversationToken, connectionType})`. Voice defaults to **WebRTC**, text to **WebSocket**. Callbacks: onConnect, onDisconnect, onMessage, onError, onStatusChange, onModeChange, onCanSendFeedbackChange, onAudioAlignment. Methods: endSession, getId, setVolume, get{Input,Output}Volume, sendFeedback, sendContextualUpdate, sendUserMessage, sendUserActivity (~2 s pause), setMicMuted, changeInput/OutputDevice, get*ByteFrequencyData. WebRTC is fixed at pcm 48 kHz. |
| React | `@elevenlabs/react` | `ConversationProvider` plus `useConversation` and granular hooks (`useConversationControls/Status/Input/Mode/Feedback`, `useRawConversation`, `useConversationClientTool`). Options: clientTools, overrides, textOnly, `serverLocation` (`us`, `eu-residency`, `in-residency`, `global`). Extra callbacks: onVadScore, onAgentChatResponsePart, onUnhandledClientToolCall, onDebug. `sendMCPToolApprovalResult`. |
| React Native | `@elevenlabs/react-native` (+ LiveKit) | Same API as React. Expo dev builds only (not Expo Go). RN 0.79+. |
| Python | `elevenlabs` (`[pyaudio]` extra) | `Conversation` with `DefaultAudioInterface` or a custom `AudioInterface`. |
| Swift | `elevenlabs-swift-sdk` (v2+/v3.x) | iOS 14+, macOS 11+, Swift 5.9. Reactive `@Published`. Conversation token for private agents. |
| Kotlin | `io.elevenlabs:elevenlabs-android` | API 21+. WebRTC. Token valid for 10 minutes. |
| CLI | `@elevenlabs/cli` / `brew install elevenlabs/tap/elevenlabs` | `agents init / add --template / push [--dry-run] [--branch] / pull [--update] / status / list / widget embed`, `tools add`, `tests`, `agents procedures`, `generate-skills` |
| UI kit | ui.elevenlabs.io | shadcn-based components |

- **WebSocket:**
  - Endpoint: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...`. Private agents use a signed URL from `GET /v1/convai/conversation/get_signed_url`.
  - **WebRTC token:** `GET /v1/convai/conversation/token`.
- **Server → client events:** `conversation_initiation_metadata`, `queue_status`, `ping`, `audio`, `user_transcript`, `agent_response`, `agent_response_correction`, `agent_response_metadata`, `client_tool_call`, `agent_tool_response(_full_payload)`, `vad_score`, `mcp_tool_call`, `agent_chat_response_part`, `agent_reasoning_response_part`, `agent_response_complete`, `guardrail_triggered`, `context_usage`.
- **Client → server events:** `contextual_update`, `user_message`, `user_activity`, client tool results, pong.
- **Data residency servers:** `api.eu.residency`, `api.in.residency`, `api.sg.residency` and `api.us`.

---

### 13. Pricing (Oct 2026)

| Plan | $/month | Included agent minutes | Voice concurrency |
|---|---|---|---|
| Free | 0 | 15 | 4 |
| Starter | 6 (first-month promo shown as $1) | 75 | 6 |
| Creator | 22 (first-month promo $11) | 275 | 10 |
| Pro | 99 | 1,238 | 20 |
| Scale | 299 | 3,738 | 30 |
| Business | 990 | 12,375 | 40 |
| Enterprise | Custom | Custom | Elevated |

- **Additional minutes:** **$0.08/min** on all plans. V3 Conversational costs the same ("starting at $0.08/min").
- **Burst:** **$0.16/min** (2×). Up to 3× concurrency or 300, whichever is lower, for non-Enterprise. Burst calls get deprioritized processing.
- **Text messages:** **$0.003 per message** (text-only and multimodal).
- **Silence:** stretches longer than 10 s are billed at **5%** (a 95% discount). This is disabled if `retranscribe_on_turn_timeout` is on.
- **Setup and testing calls:** billed at **half price** **[from search snippets of the help center; not on the current help page I fetched]**.
- **LLM:** billed separately at the provider's rate with no markup (select Gemini and Claude models carry a +10% Vertex regional uplift). Deducted from credits. **Detailed costs** button in Primary LLM.
- **Other charges:** telephony is billed by your carrier with no ElevenLabs fee. Queue time is free. File uploads are billed per file.
- **Billing duration:** measured from connection until hang-up or window close.
- **Discrepancies:**
  - The chat-mode doc lists Business voice concurrency as 30; the pricing page says 40.
  - Third-party sources disagree on the Business minutes and price.

---

### 14. Compliance, privacy, limits (quick reference)

- **ZRM:** per agent, or workspace-enforced. No recordings or PII stored. No MCP, batch calling or Flag-issue. Architect chats are not covered.
- **HIPAA:** BAA on Enterprise, limited to a subset of LLMs.
- **Other compliance:** GDPR data residency (EU, India, Singapore), TCPA guidance, AI disclosure requirement.
- **Concurrency (voice / chat):** Free 4/100, Starter 6/150, Creator 10/250, Pro 20/500, Scale 30/750, Business 30–40/750, Enterprise elevated.

---

### 15. Unverified items and open questions

- The exact tab order and names in the current editor. The docs use "Voice", "Agent Voice" and "Voice Settings", and also "Widget tab" and "Channels → Widget → Interface". Settings appear to move between Agent, Advanced and Security over time.
- Where the Guardrails, Audio effects, Analysis LLM and Alerting UIs sit.
- Dashboard template names and count: 50+ per Product Hunt (Apr 2026). Not confirmed in the docs.
- The half-price setup/testing discount appears in help-center search snippets but not on the page I fetched.
- Default retention: "2 years" in the UI docs versus `-1` (unlimited) as the API default.
- Default TTS model: the language page says Flash v2; the API and help center say **Eleven v4 Turbo**.
- Business plan concurrency: 30 or 40.

---

### Sources

- https://elevenlabs.io/docs/llms.txt (doc index; all pages below were fetched in their `.md` form)
- https://elevenlabs.io/docs/eleven-agents/overview
- https://elevenlabs.io/docs/eleven-agents/quickstart
- https://elevenlabs.io/docs/eleven-agents/build/overview
- https://elevenlabs.io/docs/eleven-agents/customization/llm
- https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm
- https://elevenlabs.io/docs/eleven-agents/customization/llm/llm-cascading
- https://elevenlabs.io/docs/eleven-agents/customization/llm/optimizing-costs
- https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow
- https://elevenlabs.io/docs/eleven-agents/customization/channel-behavior
- https://elevenlabs.io/docs/eleven-agents/customization/multimodal-input
- https://elevenlabs.io/docs/eleven-agents/customization/voice
- https://elevenlabs.io/docs/eleven-agents/customization/voice/customization/language
- https://elevenlabs.io/docs/eleven-agents/customization/voice/multi-voice-support
- https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode
- https://elevenlabs.io/docs/eleven-agents/customization/voice/speed-control
- https://elevenlabs.io/docs/eleven-agents/customization/voice/pronunciation-dictionary
- https://elevenlabs.io/docs/eleven-agents/customization/voice/audio-environment
- https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base
- https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/rag
- https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/manage-documents
- https://elevenlabs.io/docs/eleven-agents/customization/tools
- https://elevenlabs.io/docs/eleven-agents/customization/tools/webhook-tools
- https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools
- https://elevenlabs.io/docs/eleven-agents/customization/tools/code-tools
- https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp
- https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp/security
- https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools (and its sub-pages: end-call, language-detection, agent-transfer, transfer-to-number, skip-turn, play-keypad-touch-tone, voicemail-detection, update-state, flag-issue-for-review)
- https://elevenlabs.io/docs/eleven-agents/customization/tools/tool-configuration/tool-call-sounds
- https://elevenlabs.io/docs/eleven-agents/customization/tools/tool-configuration/tool-interruptions
- https://elevenlabs.io/docs/eleven-agents/customization/personalization
- https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables
- https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides
- https://elevenlabs.io/docs/eleven-agents/customization/agent-workflows
- https://elevenlabs.io/docs/eleven-agents/customization/procedures (+ free-form-procedures, structured-procedures)
- https://elevenlabs.io/docs/eleven-agents/customization/authentication
- https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis (+ success-evaluation, data-collection, sentiment-analysis, smart-search)
- https://elevenlabs.io/docs/eleven-agents/customization/agent-testing
- https://elevenlabs.io/docs/eleven-agents/guides/simulate-conversation
- https://elevenlabs.io/docs/eleven-agents/customization/privacy (+ retention, audio-saving, zrm, conversation-history-redaction)
- https://elevenlabs.io/docs/eleven-agents/customization/widget
- https://elevenlabs.io/docs/eleven-agents/customization/events (+ client-events, client-to-server-events)
- https://elevenlabs.io/docs/eleven-agents/customization/opentelemetry-traces
- https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide
- https://elevenlabs.io/docs/eleven-agents/best-practices/guardrails
- https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls
- https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-trunking
- https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration
- https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/register-call
- https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks
- https://elevenlabs.io/docs/eleven-agents/whatsapp
- https://elevenlabs.io/docs/eleven-agents/libraries/java-script
- https://elevenlabs.io/docs/eleven-agents/libraries/react
- https://elevenlabs.io/docs/eleven-agents/libraries/react-native
- https://elevenlabs.io/docs/eleven-agents/libraries/python
- https://elevenlabs.io/docs/eleven-agents/libraries/swift
- https://elevenlabs.io/docs/eleven-agents/libraries/kotlin
- https://elevenlabs.io/docs/eleven-agents/libraries/web-sockets
- https://elevenlabs.io/docs/eleven-agents/dashboard (+ spotlight, real-time-insights, topic-discovery)
- https://elevenlabs.io/docs/eleven-agents/operate/versioning
- https://elevenlabs.io/docs/eleven-agents/operate/experiments
- https://elevenlabs.io/docs/eleven-agents/operate/merge-proposals
- https://elevenlabs.io/docs/eleven-agents/operate/users
- https://elevenlabs.io/docs/eleven-agents/operate/triage
- https://elevenlabs.io/docs/eleven-agents/operate/cli
- https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp
- https://elevenlabs.io/docs/eleven-agents/operate/architect
- https://elevenlabs.io/docs/eleven-agents/integrate/environment-variables
- https://elevenlabs.io/docs/eleven-agents/guides/chat-mode
- https://elevenlabs.io/docs/eleven-agents/guides/call-queueing
- https://elevenlabs.io/docs/eleven-agents/guides/burst-pricing
- https://elevenlabs.io/docs/eleven-agents/guides/realtime-monitoring
- https://elevenlabs.io/docs/eleven-agents/legal/hipaa
- https://elevenlabs.io/docs/eleven-agents/api-reference/agents/create
- https://elevenlabs.io/docs/changelog (2026-06-01 through 2026-10-05 entries)
- https://elevenlabs.io/docs/help-center/product/eleven-agents/how-much-does-eleven-agents-cost
- https://elevenlabs.io/docs/help-center/product/eleven-agents/which-languages-can-i-use-with-eleven-agents
- https://elevenlabs.io/docs/help-center/product/eleven-agents/how-many-eleven-agents-requests-can-i-make-and-can-i-increase-it
- https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenAgents-cost
- https://elevenlabs.io/pricing/agents
- https://elevenlabs.io/pricing/api
- https://hunted.space/product/elevenlabs-agent-templates (third-party; templates)
- https://www.happyrobot.ai/hub/elevenlabs-pricing (third-party; pricing cross-check)
- https://www.getmacha.com/blog/elevenlabs-agents-pricing-explained (third-party; pricing cross-check)


---

# PART 4
## ElevenLabs: Speech to Text, Developer Platform, Pricing, Account/Workspace and Other Apps

Research date: 2026-10-10. Primary sources: the official docs (each page fetched as `.md`), the live OpenAPI spec at `https://api.elevenlabs.io/openapi.json` (414 operations), elevenlabs.io/pricing, elevenlabs.io/pricing/api, the help center (now under elevenlabs.io/docs/help-center), and the changelog through 2026-10-05.

Notes on confidence:
- **[Verified]** means the claim was read on an official page or in the OpenAPI spec during this session.
- **[Unverified]** means it comes from third-party sources or inference, or the docs don't fully describe it. In particular, I could not see the logged-in web app, so sidebar layouts are rebuilt from doc references.
- **[Conflict]** marks places where official sources disagree. Each one is called out where it appears.

Current branding: the product is split into three platforms. **ElevenCreative** covers the creator and web tools (formerly "Creative Platform"). **ElevenAgents** covers conversational agents (formerly "Conversational AI" / "Agents Platform"; `convai` in API paths). **ElevenAPI** is the developer API.

---

### 1. Speech to Text (Scribe)

#### 1.1 Models

| Model ID | Type | Status | Key facts |
|---|---|---|---|
| `scribe_v2` | Batch (HTTP) | Current flagship; the default in the web UI | 90+ languages; keyterm prompting up to 1,000 terms; entity detection with 65 entity types; transcript editing; word timestamps; diarization up to 32 speakers; dynamic audio tagging; smart multi-language detection |
| `scribe_v2_realtime` | Streaming (WebSocket) | Current | About 150 ms latency (partials); 90+ languages; VAD or manual commit; PCM 8 to 48 kHz and μ-law; keyterms (up to 50); entity detection; transcript editing |
| `scribe_v2_medical` | Batch | GA since 2026-09-11 | Fine-tune of Scribe v2 for clinical audio. About 35% fewer errors on clinical audio and no regression on everyday speech. Same API, request shape and price as Scribe v2. HIPAA-eligible with a BAA (Enterprise) and ZRM. Intended to produce draft transcripts for a clinician to review, not for diagnosis |
| `scribe_v1` | Batch | **Deprecated** ("outclassed by v2 models") | First generation, 90+ languages. Kept in the deprecated-models table |

[Verified: /docs/overview/models, /docs/overview/capabilities/speech-to-text, changelog 2026-09-11]

#### 1.2 Languages

The docs list 90+ languages for Scribe v2, grouped into accuracy tiers by WER [Verified]:

- **Excellent (≤5% WER), 36 languages:** Belarusian, Bosnian, Bulgarian, Catalan, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Latvian, Macedonian, Malay, Malayalam, Norwegian, Polish, Portuguese, Romanian, Russian, Slovak, Spanish, Swedish, Turkish, Ukrainian, Vietnamese.
- **High accuracy (>5% to ≤10%), 21 languages:** Armenian, Azerbaijani, Bengali, Cantonese, Filipino, Georgian, Gujarati, Hindi, Kazakh, Lithuanian, Maltese, Mandarin, Marathi, Nepali, Odia, Persian, Serbian, Slovenian, Swahili, Tamil, Telugu.
- **Good (>10% to ≤20%), 18 languages:** Afrikaans, Arabic, Assamese, Asturian, Burmese, Hausa, Hebrew, Javanese, Korean, Kyrgyz, Luxembourgish, Māori, Occitan, Punjabi, Tajik, Thai, Uzbek, Welsh.
- **Moderate (>25% to ≤50%), 19 languages:** Amharic, Ganda, Igbo, Irish, Khmer, Kurdish, Lao, Mongolian, Northern Sotho, Pashto, Shona, Sindhi, Sinhala, Somali, Urdu, Wolof, Xhosa, Yoruba, Zulu.
- The docs define no tier for 20 to 25% WER (a documentation gap).
- Marketing copy claims about 98% accuracy in major languages (English, French, Italian, Portuguese, Spanish, German).
- `language_code` takes ISO-639-1 or ISO-639-3. If it is left null, the language is auto-detected. In the UI the default setting is "Detect".

#### 1.3 Feature reference (batch API: `POST /v1/speech-to-text`)

All request fields below were taken from the OpenAPI spec [Verified]:

| Parameter | Default | Notes |
|---|---|---|
| `model_id` | required | `scribe_v2`, `scribe_v2_medical`, `scribe_v1` (deprecated) |
| `file` / `source_url` / `cloud_storage_url` (deprecated) | – | Provide exactly one source. `source_url` accepts hosted audio/video plus **YouTube, TikTok** and other video-host URLs. Minimum audio length is 100 ms |
| `language_code` | null (auto) | ISO-639-1/3 |
| `diarize` | false | Speaker labels `speaker_0…` |
| `num_speakers` | null (model max) | Up to **32** |
| `diarization_threshold` | – | Higher values mean fewer speaker splits |
| `use_speaker_library` | false | Matches detected speakers against the workspace speaker library |
| `detect_speaker_roles` | false | Labels speakers as `agent` / `customer`. Requires diarization and is not allowed with multichannel. **10% surcharge** |
| `timestamps_granularity` | `word` | `none` / `word` / `character` (character-level timestamps per word) |
| `tag_audio_events` | true | Tags such as (laughter) and (footsteps); returned as `type: "audio_event"` |
| `keyterms` | [] | Up to 1,000 terms, each under 50 characters (batch). Extra cost |
| `no_verbatim` | false | Removes fillers, false starts and non-speech sounds. Scribe v2 only (plus v2 Medical and Realtime) |
| `entity_detection` | – | `all`, a category (`pii`, `phi`, `pci`, `other`, `offensive_language`) or a list of types |
| `entity_redaction` / `entity_redaction_mode` | `enumerated_entity_type` | Modes: `redacted` → `{REDACTED}`; `entity_type` → `{NAME}`; `enumerated_entity_type` → `{NAME_0}`. Must be a subset of the detected types. The `entities` field is omitted when redaction is on |
| `transcript_edit` | – | Natural-language instruction, up to 2,000 characters. Returns `edited_transcript` alongside the original. Experimental and costs extra. Can't be combined with entity detection/redaction or multichannel (launched 2026-09-28) |
| `use_multi_channel` / `multichannel_output_style` | false / `separate` | Up to 5 channels with one speaker per channel. `combined` merges the channels with a `channel_index` per word. Entity detection isn't supported with `combined` |
| `additional_formats` | – | Up to 10 export formats, returned inline (see 1.5) |
| `file_format` | `other` | `pcm_s16le_16` (16-bit, 16 kHz mono LE) gives lower latency |
| `temperature` (0 to 2), `seed` | model default | For determinism |
| `webhook`, `webhook_id`, `webhook_metadata` | false | Async mode: the request returns early and the result is POSTed to the STT webhook. Metadata is JSON, at most 2 levels deep and 16 KB |
| `enable_logging` (query) | true | Set it to `false` for Zero Retention Mode (Enterprise) |

**Response:** `language_code`, `language_probability`, `text`, and `words[]`. Each word has `text`, `start`, `end`, `type` (`word` / `spacing` / `audio_event`), `speaker_id` and optional `characters`. The response can also include `entities`, `edited_transcript` and `additional_formats`. Supporting endpoints are `GET /v1/speech-to-text/transcripts/{transcription_id}` and `DELETE` on the same path.

**Limits and formats:**
- **File size:** The docs say up to 3 GB. [Conflict] The OpenAPI field description says under 5.0 GB.
- **Duration:** 10 hours in standard mode. [Conflict] For multichannel, the docs FAQ says a combined duration under 10 hours, while the "Key facts" section says 1 hour.
- **Audio formats:** AAC, AIFF, OGG, MP3, Opus, WAV, WebM, FLAC, M4A/MP4.
- **Video formats:** MP4, AVI, MKV, MOV, WMV, FLV, WebM, MPEG, 3GPP.
- **Internal parallelism:** Files longer than 8 minutes are split into chunks. Concurrency = `min(4, ceil(duration_secs/480))`, so a 15-minute file uses 2 and a 120-minute file uses 4.

#### 1.4 Entity detection: 65 types [Verified]

- **PII:**
  - account_number, age, bank_account, cardinal, credit_card, credit_card_expiration, cvv
  - date, date_interval, dob, driver_license, email_address, event, filename
  - gender, gender_sexuality (legacy), sexual_orientation, healthcare_number, ip_address
  - location, location_address, location_city, location_coordinate, location_country, location_state, location_zip
  - money, name, name_given, name_family, name_medical_professional, numerical_pii
  - occupation, ordinal, origin, passport_number, password, percent, phone_number
  - physical_attribute, ssn, time, url, username, vehicle_id
- **PHI:** condition, drug, injury, blood_type, medical_process, clinical_measurement, statistics (legacy).
- **PCI:** credit_card, credit_card_expiration, cvv.
- **Other:** language, marital_status, organization, political_affiliation, religion, routing_number, zodiac_sign, product_or_service, food_or_beverage, document_reference, generic_id, measurement, time_duration.
- **Offensive language:** very_offensive_language, less_offensive_language.

Each type is tagged with the regulations it relates to: CPRA, GDPR, HIPAA, Quebec Privacy Act and APPI.

#### 1.5 Export formats

- **API `additional_formats` (up to 10 per request):**
  - Formats: `segmented_json`, `docx`, `pdf`, `txt`, `html`, `srt`.
  - Common options: `include_speakers`, `include_timestamps`, `segment_on_silence_longer_than_s`, `max_segment_duration_s`, `max_segment_chars`.
  - TXT adds `max_characters_per_line` (default 100).
  - SRT adds `max_characters_per_line` (default 42) and defaults to `include_speakers=false` and `segment_on_silence_longer_than_s=0.8`.
  - Each result carries `requested_format`, `file_extension`, `content_type`, `is_base64_encoded` and `content`. [Verified: OpenAPI]
- **Web Transcript Editor → Export:** Plain text, JSON, HTML, SRT, VTT. [Verified: /docs/eleven-creative/products/transcripts]
- **Web Subtitle Editor → Export:** SRT, VTT.
- **Dubbing transcripts:** These have a separate endpoint, `GET /v1/dubbing/{id}/transcripts/{lang}/format/{format_type}`.
- Note: the UI offers VTT, which the API `additional_formats` list does not. The API offers DOCX and PDF, which the UI export list in the docs does not show.

#### 1.6 Realtime STT (Scribe v2 Realtime)

**Connection** [Verified: AsyncAPI on the API reference page]
- Endpoint: `wss://api.elevenlabs.io/v1/speech-to-text/realtime`.
- Regional hosts: US `api.us.elevenlabs.io`, EU `api.eu.residency.elevenlabs.io`, India `api.in.residency.elevenlabs.io`, Singapore `api.sg.residency.elevenlabs.io`.
- Auth: the `xi-api-key` header, or `?token=` with a single-use token of type `realtime_scribe`.

**Query parameters:** `model_id`, `token`, `audio_format`, `language_code`, `secondary_languages`, `commit_strategy` (`manual` default | `vad`), `vad_threshold`, `vad_silence_threshold_secs`, `min_speech_duration_ms`, `min_silence_duration_ms`, `include_timestamps` (false), `include_language_detection` (false), `keyterms` (≤50 terms, ≤20 characters each), `no_verbatim`, `entity_detection`, `transcript_edit`, `filter_background_audio` (false), `keepalive_interval_ms` (500 to 10,000), `enable_logging` (true).

**Audio formats:** pcm_8000, pcm_16000 (recommended), pcm_22050, pcm_24000, pcm_44100, pcm_48000, ulaw_8000. Mono only. Send chunks of 0.1 to 1 second.

**Events:**
- Client sends `input_audio_chunk`.
- Server sends `session_started`, `partial_transcript`, `committed_transcript`, `committed_transcript_with_timestamps`, `committed_transcript_entities` and `edited_transcript`.

**Errors:** `auth_error`, `quota_exceeded`, `transcriber_error`, `input_error`, `invalid_request`, `error`, `commit_throttled`, `unaccepted_terms`, `rate_limited`, `queue_overflow`, `resource_exhausted`, `session_time_limit_exceeded`, `chunk_size_exceeded`, `insufficient_audio_activity`.

**Behavior:**
- Processing starts after the first about 2 seconds of audio.
- Commit every 20 to 30 seconds. Committing several times in quick succession degrades quality.
- `previous_text` context (best under 50 characters) is allowed only on the first chunk.
- The server closes the connection after 15 seconds with no client messages.

**SDKs:** JS (`@elevenlabs/client` Scribe), a React hook (`@elevenlabs/react`), and server-side Python/JS.

#### 1.7 STT concurrency per plan [Verified: models page and STT FAQ]

| Plan | STT (batch) | Realtime STT |
|---|---|---|
| Free | 8 | 6 |
| Starter | 12 | 9 |
| Creator | 20 | 15 |
| Pro | 40 | 30 |
| Scale | 60 | 45 |
| Business | 60 | 45 |
| Enterprise | Elevated | Elevated |

#### 1.8 STT pricing [Verified: /pricing/api, /pricing]

| Model | $/hour | Keyterm add-on | Transcript-edit add-on | Included hours (Free / Starter / Creator / Pro / Scale / Business) |
|---|---|---|---|---|
| Scribe v2 and v2 Medical | **$0.22** | +$0.05/h | +$0.07/h | 4.5 / 27 / 100 / 450 / 1,359 / 4,500 |
| Scribe v2 Realtime | **$0.39** | +$0.08/h | +$0.12/h | 2.5 / 15 / 56 / 254 / 767 / 2,538 |

- In credits, the pricing page says STT costs about **330 credits per minute**.
- [Conflict] The STT FAQ inside the docs says keyterms add "+20%" and entity detection "+30%", and mentions "up to 100 keyterms" (this looks outdated). The pricing page doesn't list an entity-detection price.
- Speaker-role detection adds a 10% surcharge (OpenAPI).
- Human transcription through Productions starts at **$2.00/min**. Human subtitles start at **$2.20/min**.

#### 1.9 Web UI: Speech to Text page and Transcript/Subtitle Editor [Verified: product guides]

**Speech to Text page** (`elevenlabs.io/app/speech-to-text`):
- **Transcribe files** button opens an upload modal for audio or video files, up to 3 GB.
- Modal options:
  - **Primary language** dropdown (default "Detect").
  - **Tag audio events** toggle.
  - **Keyterms** field (up to 1,000).
  - **Include subtitles** toggle.
  - **Upload files** button submits the job.
  - [Unverified] A diarization or speaker-count control in the modal isn't described in current docs.
- **Center pane:** A list of transcripts. Click a file name to open it. Clicking any word seeks playback to that point.
- **Export** button, top right.
- **Rename speakers:** an "edit" button next to the "Speakers" label.

**Transcript Editor** (opens when you click a transcript):
- **Layout:** Tabs at the top switch between **Transcription** and **Subtitles** modes. A right-hand panel shows details (rename, exact timestamps, Delete), and a timeline holds the speaker tracks.
- **Text editing:** WYSIWYG. Cmd+Z undoes.
- **Segment times:** Drag timeline handles, or type exact times in the right panel.
- **Segments:**
  - Press **Enter** to split a segment.
  - **Merge segments** button (only for adjacent segments from the same speaker).
  - **Add Segment** icon, then click a spot on the timeline.
  - **Delete** in the right panel, or the Delete key.
- **Align words:** a button that recomputes word timestamps after edits.
- **Speakers:**
  - Reassign one segment through the **orb** next to the speaker name (dropdown).
  - Reassign in bulk through **⋮ → Move Segments To**.
  - **+** above the tracks adds a speaker.
  - **⋮ → Delete** removes a speaker and all of its segments.
  - Drag to reorder speaker tracks. The orb also changes a speaker's color.
- **Playback speed:** an indicator next to Play.
- **Export:** Plain text, JSON, HTML, SRT, VTT.
- **Subtitles:** Use **+** next to "Subtitles" in the right panel.

**Subtitle mode:**
- Cues get red or green validation against the rules: characters per line, lines on screen and cue duration.
- **⋮ next to Subtitles → Edit rules** changes those rules.
- Splitting and merging work the same way (Enter / **merge cues**). **Add cue** adds one.
- Export: SRT or VTT.
- Subtitles are fully independent of the transcript, so edits in one don't affect the other.

---

### 2. Developer platform (ElevenAPI)

#### 2.1 Base URLs and environments [Verified]

| Environment | REST | WebSocket | Web app |
|---|---|---|---|
| Global (default) | `https://api.elevenlabs.io` | `wss://api.elevenlabs.io` | elevenlabs.io/app |
| US | `https://api.us.elevenlabs.io` | `wss://api.us.elevenlabs.io` | – |
| EU residency | `https://api.eu.residency.elevenlabs.io` | `wss://api.eu.residency.elevenlabs.io` | eu.residency.elevenlabs.io |
| India residency | `https://api.in.residency.elevenlabs.io` | `wss://api.in.residency.elevenlabs.io` | in.residency.elevenlabs.io |
| Singapore residency | `https://api.sg.residency.elevenlabs.io` | `wss://api.sg.residency.elevenlabs.io` | sg.residency.elevenlabs.io |

Machine-readable specs:
- OpenAPI 3.1: `api.elevenlabs.io/openapi.json`.
- AsyncAPI 2.6 for the WebSockets: linked from docs/llms.txt.
- Docs index for LLMs: `elevenlabs.io/docs/llms.txt`. Append `.md` to any docs page URL to get Markdown.
- Docs MCP server: `https://elevenlabs.io/_mcp/server`.

#### 2.2 Authentication [Verified]

**`xi-api-key` header** on every REST call. Keys must never be put in client-side code.

**API key types:**
- **User API keys** are tied to a person. They support an **Expire After** setting with presets from 15 minutes to 30 days, or **Never** (the default). An **Expires** column shows when each key lapses.
- **Service account API keys** belong to a service account, which acts as a workspace member. They are for multi-seat workspaces, are managed by admins, and never expire. "Workspace API keys" were formerly a single-key service account.

**Per-key restrictions:**
1. **Scope (permissions):** either `all` or a list (see below).
2. **Credit quota** (`character_limit` per month).
3. **IP allowlist:** 1 to 100 entries of IPv4/IPv6 addresses or CIDR ranges. Private ranges are rejected. A request from another IP gets 403.
4. Enterprise only: `tts_concurrency_limit`, `dubbing_concurrency_limit`, `music_concurrency_limit`, and `platform_limits` for credits, PVCs and concurrency.

**Permission scopes** (the `PermissionType` enum in OpenAPI):
- **Generation:** text_to_speech, speech_to_speech, speech_to_text, sound_generation, audio_isolation, voice_generation, forced_alignment, music_generation, image_video_generation, flows, templates.
- **Models, voices and history:** models_read/write, voices_read/write, voice_collections_read/write, speech_history_read/write.
- **Products:** dubbing_read/write, pronunciation_dictionaries_read/write, projects_read/write, audio_native_read/write, convai_read/write.
- **User and workspace:** user_read/write, workspace_read/write.
- **Voice cloning and sharing:** add_voice_from_voice_library, create_instant_voice_clone, create_professional_voice_clone, publish_voice_to_voice_library, share_voice_externally.
- **Administration:** create_user_api_key, workspace_analytics_full_read, webhooks_write, service_account_write, group_members_manage, workspace_members_read/invite/remove, terms_of_service_accept, audit_log_read, conversation_privacy_manage, copy_resources_cross_workspace, synthid_detector.

**Key safety:**
- ElevenLabs is part of GitHub secret scanning. A key leaked publicly is auto-disabled with `disable_reason: exposed_publicly`.
- A key holder can self-disable with `POST /v1/workspaces/api-keys/disable?api_key_name=self`.
- The `third_party_disable_allowed` setting can be set per key or by workspace policy. It is on by default for non-Enterprise plans and off for Enterprise.
- Rotation means creating a new key with the same permissions, switching over, then deleting the old one.

**Single-use tokens:**
- Endpoint: `POST /v1/single-use-token/{token_type}`, with types `realtime_scribe`, `batch_scribe` and `tts_websocket`.
- Returns `{"token":"sutkn_..."}`. A token is valid for 15 minutes and consumed on use. It is passed as `?token=` (or `single_use_token` on the TTS WebSocket).
- Agents use a separate mechanism: signed URLs and conversation tokens from the ElevenAgents endpoints.

**OAuth:** Used for the hosted MCP server and for `elevenlabs auth login` in the CLI.

#### 2.3 SDKs and libraries [Verified: /docs/eleven-api/resources/libraries]

- **Official REST SDKs:**
  - Python: `pip install elevenlabs` (github elevenlabs/elevenlabs-python).
  - JS/TS (Node): `npm i @elevenlabs/elevenlabs-js` (github elevenlabs/elevenlabs-js).
  - Both accept extra body, query and header parameters for fields they don't type yet. In TS this needs v2.59.0 or later.
- **Agents SDKs:** `@elevenlabs/client` (JS), `@elevenlabs/react`, `@elevenlabs/react-native`, Python (`elevenlabs`), Swift (ElevenLabsSwift), Kotlin/Android (`io.elevenlabs:elevenlabs-android`) and Flutter (`elevenlabs_agents`). Changelog entries also mention iOS SDK releases.
- **Speech Engine SDK references:** JS and Python. They also integrate with LiveKit and Pipecat.
- **Community libraries:** Vercel AI SDK (`ai`), .NET (ElevenLabs-DotNet), Unity (com.rest.elevenlabs).
- **Agent Skills:** `npx skills add elevenlabs/skills`. Covers TTS, STT, realtime STT, agents, Speech Engine, SFX, music, voice changer, isolator and API-key setup.
- **Code samples:** API reference pages show Python, JS, Go and Ruby snippets.

#### 2.4 ElevenLabs CLI [Verified: /docs/eleven-agents/operate/cli]

**Install:**
- `brew install elevenlabs/tap/elevenlabs`
- Scoop: `scoop bucket add elevenlabs https://github.com/elevenlabs/scoop-bucket; scoop install elevenlabs`
- `npm i -g @elevenlabs/cli`
- A curl installer from github.com/elevenlabs/cli releases.

**Auth:**
- `elevenlabs auth login` uses browser OAuth and stores credentials in the OS keyring. The fallback is `~/.config/elevenlabs/auth-keyring.json` with 0600 permissions.
- `elevenlabs auth status` and `elevenlabs auth logout` are also available.
- In CI, set `ELEVENLABS_API_KEY` instead.

**Agents-as-code:**
- `elevenlabs agents init` creates `agents.json`, `tools.json`, `tests.json` and the `agent_configs/`, `tool_configs/` and `test_configs/` folders.
- `agents add "Name" --template <default|minimal|voice-only|text-only|customer-service|assistant>` (plus `--skip-upload`).
- `agents push [--dry-run]`, `agents pull [--agent id] [--update]`, `agents list`, `agents status`.
- `agents templates list|show`.
- `agents widget embed <id>`.
- `tools add --type webhook|client --config-path`.

**Other:** `elevenlabs generate-skills [--output-dir]` writes a SKILL.md for each command group. It works offline. The docs say the CLI "brings the REST API to your terminal".

#### 2.5 MCP servers [Verified, except where marked]

1. **Hosted MCP server:** `https://api.elevenlabs.io/v1/mcp`. Regional variants live at `/v1/mcp` on the EU, India and Singapore residency hosts.
   - Auth is OAuth. It is listed in the Claude Desktop connector directory (Settings → Connectors → ElevenLabs → Connect).
   - Tools:
     - Create, update, list, compare, duplicate and delete agents.
     - Read conversations and transcripts, and explore topics.
     - Manage procedures, tools, MCP servers and knowledge base, and run tests.
     - Work with branches, drafts, deployments and merge proposals, and triage tickets.
     - Estimate LLM cost, read the widget configuration and agent links, and generate TTS (returned as a short-lived link).
   - Changes publish directly, not as drafts.
   - Scopes cover ElevenAgents read/write and TTS.
2. **Docs MCP server:** `https://elevenlabs.io/_mcp/server` (named in llms.txt).
3. **Local open-source MCP server** `elevenlabs/elevenlabs-mcp` (Python):
   - Run with `uvx elevenlabs-mcp` and env `ELEVENLABS_API_KEY`.
   - Optional env: `ELEVENLABS_MCP_BASE_PATH`, `ELEVENLABS_MCP_OUTPUT_MODE`, `ELEVENLABS_API_RESIDENCY`.
   - Tools cover TTS, STT, voice cloning and design, SFX, isolation, agents and Twilio calls. Docker's catalog lists 24 tools.
   - [Unverified] These details come from third-party directories and the ElevenLabs launch blog. The current docs only feature the hosted server.
4. Agents can also *consume* external MCP servers (ElevenAgents → Tools → MCP). This isn't available under ZRM or HIPAA.

#### 2.6 Full REST endpoint list, grouped by resource [Verified: OpenAPI, 414 operations]

**Core**
- History:
  - `GET /v1/history` (filters: page_size, start_after_history_item_id, voice_id, model_id, date_before_unix, date_after_unix, sort_direction, search, source)
  - `GET|DELETE /v1/history/{id}`
  - `GET /v1/history/{id}/audio`
  - `POST /v1/history/download` (zip)
- Models: `GET /v1/models`. Fields: model_id, name, can_do_text_to_speech, can_do_voice_conversion, can_use_style, can_use_speaker_boost, serves_pro_voices, token_cost_factor, languages, model_rates, concurrency_group, max character limits, requires_alpha_access.
- User: `GET /v1/user`, `GET /v1/user/subscription`. Subscription fields include tier, character_count/limit, next_character_count_reset_unix, voice slot counts, currency, status, billing_period, next_invoice and pending_change.
- Usage: `GET /v1/usage/character-stats` (deprecated), replaced by `POST /v1/workspace/analytics/query/usage-by-product-over-time` and `POST /v1/workspace/analytics/requests` (API request log).
- Tokens: `POST /v1/single-use-token/{token_type}`.

**Text to Speech**
- `POST /v1/text-to-speech/{voice_id}`
- `POST /v1/text-to-speech/{voice_id}/with-timestamps`
- `POST /v1/text-to-speech/{voice_id}/stream`
- `POST /v1/text-to-speech/{voice_id}/stream/with-timestamps`
- WebSocket `/v1/text-to-speech/{voice_id}/stream-input`
- Multi-context WebSocket `/v1/text-to-speech/{voice_id}/multi-stream-input`

**Text to Dialogue:** `POST /v1/text-to-dialogue`, plus `/stream`, `/with-timestamps` and `/stream/with-timestamps`. It also has a WebSocket and a multi-context WebSocket (the WebSocket is used for Eleven v4/v4 Turbo/v3).

**Speech to Speech (Voice Changer):** `POST /v1/speech-to-speech/{voice_id}` and `/stream`.

**Speech to Text:**
- `POST /v1/speech-to-text`
- `GET|DELETE /v1/speech-to-text/transcripts/{id}`
- WebSocket `/v1/speech-to-text/realtime`

**Forced Alignment:** `POST /v1/forced-alignment`.

**Sound Effects:** `POST /v1/sound-generation`.

**Audio Isolation:**
- `POST /v1/audio-isolation` and `/stream`
- `GET /v1/audio-isolation/history`
- `DELETE /v1/audio-isolation/history/{id}`

**Voice Design / Text to Voice:**
- `POST /v1/text-to-voice/design`
- `POST /v1/text-to-voice` (create from preview)
- `POST /v1/text-to-voice/{voice_id}/remix`
- `GET /v1/text-to-voice/{generated_voice_id}/stream`
- `POST /v1/text-to-voice/create-previews` (deprecated)

**Voices:**
- `GET /v1/voices`, `GET /v2/voices`
- `GET|DELETE /v1/voices/{id}`, `POST /v1/voices/{id}/edit`
- `POST /v1/voices/add` (IVC)
- `POST /v1/voices/add/{public_user_id}/{voice_id}` (add shared voice)
- `GET /v1/shared-voices` (Voice Library)
- `POST /v1/similar-voices`
- `GET /v1/voices/accents`
- Settings: `GET /v1/voices/settings/default`, `GET /v1/voices/{id}/settings`, `POST /v1/voices/{id}/settings/edit`
- Samples: `GET /v1/voices/{id}/samples/{sid}/audio`, `DELETE /v1/voices/{id}/samples/{sid}`
- Collections: CRUD on `/v1/voices/collections`, plus add/remove a voice
- `POST /v1/voices/{id}/replicate-to-isolated-environment`

**PVC (Professional Voice Clones):**
- `POST /v1/voices/pvc`, `POST /v1/voices/pvc/{id}`
- Samples: `POST /samples`, `POST|DELETE /samples/{sid}`, `/samples/{sid}/audio`, `/waveform`, `/speakers`, `/separate-speakers`, `/speakers/{spk}/audio`
- Verification captcha: `GET|POST /captcha`
- `POST /train`
- `POST /verification` (manual verification)

**Studio:**
- `GET|POST /v1/studio/projects`
- `GET|POST|DELETE /v1/studio/projects/{id}`
- `/content`, `/convert`, `/snapshots` (list, get, `/stream`, `/archive`)
- `/chapters` (CRUD, `/convert`, snapshots, stream)
- `/muted-tracks`, `/pronunciation-dictionaries`
- `POST /v1/studio/podcasts`

**Dubbing:**
- Legacy and simple: `GET|POST /v1/dubbing`, `GET|DELETE /v1/dubbing/{id}`, `/audio/{lang}`, `/transcript/{lang}`, `/transcripts/{lang}/format/{format}`.
- Projects API:
  - `/v1/dubbing/project`: CRUD, language targets, and source/target transcript segments (add, update, batch-update, delete).
  - `.../language/{lang}/transcript/regenerate`.
- Dubbing Studio resource API, under `/v1/dubbing/resource/{id}`:
  - `/language`, `/speaker` (create and update), `/speaker/{spk}/segment`, `/speaker/{spk}/similar-voices`
  - `/segment/{sid}/{lang}`, `/migrate-segments`
  - `/transcribe`, `/translate`, `/dub`, `/render/{lang}`

**Music:**
- `POST /v1/music`, `/v1/music/stream`, `/v1/music/detailed`, `/v1/music/detailed/stream`
- `POST /v1/music/plan` (composition plan)
- `POST /v1/music/video-to-music`, `/v1/music/upload`, `/v1/music/stem-separation`
- Finetunes: CRUD on `/v1/music/finetunes`

**Pronunciation Dictionaries:**
- `POST /v1/pronunciation-dictionaries/add-from-file`, `/add-from-rules`
- `GET /v1/pronunciation-dictionaries`
- `GET|PATCH /{id}`
- `POST /{id}/set-rules`, `/add-rules`, `/remove-rules`
- `GET /{id}/{version}/download` (PLS)

**Audio Native:**
- `POST /v1/audio-native`
- `GET /{id}/settings`
- `POST /{id}/content`, plus update from URL

**Productions (human services):**
- `/v1/productions/orders`: CRUD, `/media`, `/items`, `/submit`, `/deliverables`
- `/orders/languages/{kind}`

**ElevenCreative Flows and Assets:**
- `/v1/flows/video`, `/v1/flows/image`, `/v1/flows/text-to-speech` (create, list, get)
- `/v1/flows/templates` (list, get) and `/templates/{id}/runs`
- `/v1/assets` (upload, list, get, delete)

**Speech Engine:** CRUD on `/v1/speech-engine`, `POST /{id}/duplicate`, and a WebSocket.

**Workspace:**
- Members: `GET|POST /v1/workspace/members`.
- Invites: `POST /v1/workspace/invites/add`, `/add-bulk`, `DELETE /v1/workspace/invites`.
- Groups: `GET /v1/workspace/groups`, `/search`, `POST /groups/{id}/members`, `/members/remove`.
- Resources: `GET /v1/workspace/resources/{id}`, `POST /share`, `/unshare`.
- Webhooks: CRUD on `/v1/workspace/webhooks`.
- Service accounts: `GET|POST /v1/service-accounts`, and CRUD on `/v1/service-accounts/{uid}/api-keys`.
- API keys: `POST /v1/workspaces/api-keys/disable`, `/third-party-disabling`.
- Auth connections: CRUD on `/v1/workspace/auth-connections`.
- `GET /v1/workspace/audit-logs` (Enterprise, `audit_log_read`, 30 requests/min).

**ElevenAgents (`/v1/convai/...`, about 160 operations):**
- Agents: CRUD, duplicate, link, simulate, LLM-usage calculation, summaries.
- Agent structure: branches, drafts, deployments, versions, merge proposals, procedures, hold audio.
- Conversations: list, get, summary, audio, signed URL, token, feedback, files, SIP messages, tags, topics, analysis/evaluation, text and smart search.
- Knowledge base: documents, folders, crawl jobs, RAG index, search.
- Tools, and MCP servers (approval policies, tool config overrides).
- Telephony: phone numbers, SIP trunk outbound, Twilio outbound and register, Exotel, WhatsApp (accounts, outbound call and message), batch calling.
- Testing and QA: tests, test folders, invocations, triage tickets.
- Platform: LLM list, analytics live count, environment variables, secrets, settings, dashboard, widget, users.

#### 2.7 WebSocket streaming TTS [Verified]

- **URL:** `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id=...`
- **Query parameters:** `authorization`, `single_use_token`, `model_id`, `language_code`, `enable_logging`, `output_format`, `inactivity_timeout`, `sync_alignment`, `auto_mode`, `apply_text_normalization`, `seed`, `enable_ssml_parsing`.
- **Model support:** Not available for `eleven_v3` or `eleven_v4`. Use the Text to Dialogue WebSocket for those.
- **Initialize message:** `text: " "`, `voice_settings` (stability, similarity_boost, style, use_speaker_boost, speed), `generation_config.chunk_length_schedule` (the default first threshold is 120 characters), and `pronunciation_dictionary_locators` (only in the initialize message).
- **Messages:** Send `flush: true` to force generation. Responses contain `audio` (base64) and `alignment` / `normalizedAlignment`.
- **Lifecycle:** The connection closes after 20 seconds of inactivity unless you send `" "`. Send `""` to close.
- **Concurrency:** Only the time spent generating counts toward the concurrency limit.
- **Multi-context WebSocket** (`/multi-stream-input`): multiple independent contexts on one connection. The `is_final_audio_for_turn` marker is reliable for MP3/Opus since 2026-09-21.
- **HTTP streaming** (chunked transfer) is supported for TTS, Voice Changer and Audio Isolation.

#### 2.8 Rate limits and concurrency per plan [Verified: /docs/overview/models]

| Plan | Multilingual v2 | Flash | STT | Realtime STT | Music | Priority | TTD WebSocket sessions | Agents concurrent calls (pricing/api) |
|---|---|---|---|---|---|---|---|---|
| Free | 2 | 4 | 8 | 6 | 0 | 3 | 14 | 4 |
| Starter | 3 | 6 | 12 | 9 | 2 | 4 | 21 | 6 |
| Creator | 5 | 10 | 20 | 15 | 2 | 5 | 35 | 10 |
| Pro | 10 | 20 | 40 | 30 | 2 | 5 | 70 | 20 |
| Scale | 15 | 30 | 60 | 45 | 5 | 5 | 105 | 30 |
| Business | 15 | 30 | 60 | 45 | 5 | 5 | 105 | 40 |
| Enterprise | Elevated | Elevated | Elevated | Elevated | Highest | 6 | Elevated | Custom |

- [Conflict] The /pricing comparison table shows "Concurrency" values of 2 / 3 / 5 / 10 / 15 / **25** (Business), while the models page says Business is 15 for Multilingual v2.
- A free plan with PAYG gets Starter-level concurrency (3) and priority (4).
- Over the limit, requests queue at lower priority. Enterprise requests may still succeed on a best-effort basis.
- Response headers `current-concurrent-requests` and `maximum-concurrent-requests` report usage. Other headers include `character-cost`, `request-id` and `x-trace-id`.
- Rule of thumb: a concurrency of 5 supports about 100 simultaneous broadcasts.
- 429 errors carry `rate_limit_exceeded`, `concurrent_limit_exceeded` or `system_busy`. Back off exponentially on rate limits, and wait for in-flight requests to finish on concurrency limits.

#### 2.9 Webhooks [Verified]

- **Configuration:** In the UI, go to **Developers → Webhooks** (`/app/developers/webhooks`) and click **Create webhook**. Fields:
  - **Name**.
  - **Callback URL** (HTTPS).
  - **Webhook Auth Method**: HMAC or OAuth. The OpenAPI spec also lists `mtls`.
  - **Events**, e.g. "Transcription completed".
- **API:** `/v1/workspace/webhooks`. Usage types: ConvAI Agent Settings, ConvAI Settings, Voice Library Removal Notices, Speech to Text, Agent QA Evaluations, ConvAI Alerting, Flows, Dubbing.
- **Event types:**
  - Agents: `post_call_transcription`, `post_call_audio`, `call_initiation_failure`, answering-machine detection, unredacted transcript and audio.
  - Voice Library: `voice_removal_notice`, `voice_removal_notice_withdrawn`, `voice_removed`.
  - STT: transcription completed.
  - Also: Flows, agent QA.
- **Security:** Verify the `ElevenLabs-Signature` HMAC header with `constructEvent` (JS) or `construct_event(rawBody, sig_header, secret)` (Python).
- **Payload:** Top-level `type`, `data` and `event_timestamp`. Handlers must be idempotent.
- **Retries:**
  - Opt-in. Up to 5 attempts: immediately, then after 30 seconds, 2 minutes, 8 minutes and 30 minutes, with ±10% jitter.
  - Only 5xx, 408, 429 and network errors are retried.
  - Each webhook can have at most 100 queued retries. Audio over 50 MiB is not retried, and there's a 400 MiB cap on queued audio retries.
- **Auto-disable:** After 10 or more consecutive failures, when there has been no success in the last 7 days. Admins get an email, and the webhook must be re-enabled manually.

#### 2.10 History, Usage and Models APIs: see 2.6. Notes:

- History stores TTS and Voice Changer generations. In the UI, history is a **History tab in the right panel** of Text to Speech and Voice Changer. Downloads are MP3 or WAV, and **Advanced** adds M4A and FLAC.
- Usage analytics in the UI: **Developers** (bottom of the sidebar) → **Analytics** tab with **API Requests** (total, success rate, avg latency, top path), **Usage** (credits by voice, product or API key; avg TTFB; avg time to completed transcript; concurrent requests; per user or group in a workspace) and **Webhooks** (totals and recent calls).
- **Request Log** tab: lets you search API requests.
- **Export** to CSV.
- An Account / Workspace toggle appears in multi-seat workspaces.

#### 2.11 Errors [Verified: /docs/eleven-api/resources/errors]

- **Error body:** `detail` contains `type`, `code`, `message`, `status` (legacy), `request_id` and `param`.
- **Types:**
  - `validation_error` (400)
  - `invalid_request` (400)
  - `authentication_error` (401)
  - `payment_required` (402)
  - `authorization_error` (403)
  - `not_found` (404)
  - `conflict` (409)
  - `rate_limit_error` (429)
  - `internal_error` (500)
  - `service_unavailable` (503)
- **73 codes**, including:
  - Not found: voice_not_found, history_item_not_found, model_not_found, transcript_not_found.
  - Validation: text_too_long, invalid_voice_settings, unsupported_model, invalid_audio_format, audio_too_long, audio_too_short.
  - Request: request_too_large.
  - Auth: invalid_api_key, missing_api_key.
  - Access: insufficient_permissions, feature_not_available, subscription_required, voice_access_denied, model_access_denied.
  - Conflict: concurrent_modification.
  - Limits: rate_limit_exceeded, concurrent_limit_exceeded, system_busy, insufficient_credits.
  - Availability: maintenance.
- 422 is used for FastAPI-style validation errors on some endpoints (the `detail[]` list contains `loc`, `msg` and `type`).
- When contacting support, send the `request_id`.

#### 2.12 Data residency [Verified]

- An **Enterprise-only** feature. Isolated environments exist in the **EU, India and Singapore** (US is the default).
- Each isolated environment is a separate account and workspace, with its own URL and **its own API key**.
- Storage stays in the region. Processing may happen elsewhere, unless you are in the EU and use ZRM plus the API.
- SDKs take an `environment` parameter.
- **Dubbing is not available in isolated environments.**
- Migration support is limited. A PVC can be shared by link with the host prefix swapped to `eu.residency.elevenlabs.io/...`.
- The MCP server has regional URLs.
- Contact: success@ (existing customers) or sales@ (new customers).

#### 2.13 Zero Retention Mode (ZRM) [Verified]

- Enterprise only, and **API only**. UI traffic is never covered.
- Enable it per request with `enable_logging=false` on TTS (`/v1/text-to-speech/*` and the WebSocket), TTD, Speech to Speech and STT. For agents, it is set per agent under **Privacy → Advanced → Zero Retention Mode**.
- **Not retained under ZRM:** TTS/TTD text input and audio output, Voice Changer audio, STT audio and text, all agent I/O, and the account email in logs.
- **Not eligible:** Music, Image & Video, IVC, PVC, Dubbing, Studio.
- MCP isn't supported under ZRM or HIPAA.
- Allowed agent LLMs under ZRM: Gemini, Claude, and ElevenLabs-hosted Qwen.
- Without ZRM, deleted items stay in backups for up to 30 days.

#### 2.14 Other developer notes

- **Private deployments:** ElevenAgents, TTS and STT can run inside the customer's own cloud (an Enterprise capability page).
- **Breaking changes policy:** Published at /docs/eleven-api/resources/breaking-changes-policy.
- **Agent alerting:** Can notify Slack, PagerDuty or a webhook (changelog 2026-09-21).

---

### 3. Pricing and plans (as of 2026-10-10)

#### 3.1 Self-serve plans [Verified: elevenlabs.io/pricing and /pricing/api]

| Plan | Monthly | Annual (2 months free) | Credits/mo | Custom voice slots | PVC | Concurrency (pricing page) | Full / Basic seats | Commercial license | Audio quality |
|---|---|---|---|---|---|---|---|---|---|
| **Free** | $0 | – | 10,000 | 3 (Voice Design only; no cloning) | – | 2 | 1 / 20 | **No.** Non-commercial use with attribution | 128 kbps MP3, 44.1 kHz |
| **Starter** | $6 (promo: $1 first month, until Oct 18) | $60 ($5/mo) | 30,000 | 10 | – | 3 | 1 / 20 | Yes | 128 kbps |
| **Creator** | $22 (promo: $11 first month) | $220 (~$18.33/mo) | 121,000 | 30 | 1 | 5 | 1 / 20 | Yes | 128 and 192 kbps |
| **Pro** | $99 | $990 ($82.50/mo) | 600,000 | 160 | 1 | 10 | 1 / 20 (can buy up to 11 Full) | Yes | 192 kbps, plus **44.1 kHz PCM via API** |
| **Scale** | $299 | $2,990 | 1,800,000 | 660 | 3 | 15 | 3 / 20 | Yes | 192 kbps, PCM |
| **Business** | $990 | $9,900 | 6,000,000 | 2,200 | 10 | 25 (models page: 15) | 10 / 20 | Yes | 192 kbps, PCM; low-latency TTS "as low as 5¢/min" |
| **Enterprise** | Custom | Custom | Custom | More | More | Elevated | 11+ (contract) / ~1,000 | Custom terms, DPA/SLA, BAA (HIPAA) | Custom |

**Features by plan:**
- **Free:** TTS, STT, SFX, Voice Design, Music, Productions, Image, and 3 Studio projects.
- **Starter adds:** commercial license, Instant Voice Cloning, 20 Studio projects, Music commercial use, Dubbing Studio, and Image & Video.
- **Creator adds:** Professional Voice Cloning.
- **Pro adds:** 192 kbps and PCM output via the API.
- **Scale adds:** a 3-seat workspace, collaboration, and 3 PVCs.
- **Business adds:** 10 seats and 10 PVCs.
- **Enterprise adds:** SSO/SCIM, audit logs, data residency, ZRM, model approvals, member roles, priority support and volume discounts.
- **All plans:** "74 languages" (the Eleven v3 TTS language count shown on the pricing page).
- **Startup Grants:** 12 months free, 33M characters (more than 680 Agent hours, valued above $5,500), Scale-level benefits and high concurrency.

**Approximate overage per extra TTS minute** (pricing page): Free ~$0.36, Starter ~$0.20, Creator ~$0.18, Pro/Scale/Business ~$0.17.

#### 3.2 Credits per product (web UI) [Verified: pricing page]

| Product | Credits |
|---|---|
| Text to Speech | 1 credit/character. API Flash/Turbo models cost 0.5 to 1 credit/character |
| Speech to Text | ~330 credits/minute |
| Eleven Music | ~900 credits/minute |
| Sound Effects | ~200 credits per generation |
| Voice Changer / Voice Isolator | ~1,000 credits/minute |
| Dubbing | Automatic 2,000/min (watermark) or 3,000/min (no watermark); Dubbing Studio 5,000/min (watermark) or 10,000/min (no watermark) |

#### 3.3 API ($) pricing [Verified: /pricing/api; promos as shown on 2026-10-10]

| Product | Unit price | Included per plan (Free / Starter / Creator / Pro / Scale / Business) |
|---|---|---|
| TTS Eleven v4 | $0.022 per 1K chars (promo, 72% off until Oct 12; list $0.08) | 10K / 273K / 1M / 4.5M / 13.59M / 45M chars |
| TTS Eleven v4 Turbo | $0.011 per 1K (promo; list $0.04) | 20K / 545K / 2M / 9M / 27.18M / 90M |
| TTS v3, Multilingual v2 | $0.08 per 1K | 10K / 75K / 275K / 1.238M / 3.738M / 12.375M |
| TTS v3 Conversational, Flash/Turbo | $0.04 per 1K | 20K / 150K / 550K / 2.475M / 7.475M / 24.75M |
| STT Scribe v2 / Medical | $0.22/h (+$0.05 keyterms, +$0.07 edit) | 4.5 / 27 / 100 / 450 / 1,359 / 4,500 h |
| STT Scribe v2 Realtime | $0.39/h (+$0.08, +$0.12) | 2.5 / 15 / 56 / 254 / 767 / 2,538 h |
| Agents / Speech Engine | $0.08/min (burst $0.16/min) | 15 / 75 / 275 / 1,238 / 3,738 / 12,375 min |
| Music | $0.15/min; finetune $1.50 each | 3 / 40 / 147 / 660 / 1,993 / 6,600 min |
| Sound Effects | $0.12/min | 8 / 150 / 605 / 3,000 / 9,000 / 30,000 generations |
| Voice Changer / Isolator | $0.12/min | 8.3 / 50 / 183 / 825 / 2,492 / 8,250 min |
| Dubbing v1 | $0.33/min (watermark) / $0.50 (none) | e.g. 2.53 / 18 / 67 / 300 / 906 / 3,000 min |
| Dubbing v2 | $2.20/min | Not clearly listed per plan |

Forced alignment and Image/Video API prices weren't shown [Unverified]. Image/Video uses credits, and grant users can spend up to 1M grant credits on it.

#### 3.4 Credit mechanics and billing [Verified]

- **Rollover:** Unused credits roll over for up to 2 months (cap of 2x the monthly quota). This requires an active paid plan that hasn't been downgraded or cancelled. Free plans don't roll over. Enterprise annual plans can take credits as a yearly lump sum.
- **Upgrade:** Takes effect immediately and starts a new cycle. Unused credits carry over.
- **Downgrade or cancel:** Takes effect at the end of the cycle. Unused credits are forfeited.
- **Pay As You Go (Top Up)** in **Developers → Top Up**, available on all self-serve tiers including Free:
  - Minimum top-up is $5 (₹500). Maximum is 250 top-ups per month.
  - The balance is stored in dollars and converted to credits at the current plan's rate. Credits expire after 12 months.
  - **Auto Top Up** defaults: $20 charge when the balance falls below $10.
  - Service pauses at $0.
  - Without 2FA there's a monthly cap: Free/Starter/Creator $100, Pro $200, Scale $600, Business $2,000. Enabling 2FA removes the cap.
  - Plan credits are used first, then PAYG.
  - Not available for app-store subscriptions.
- **Usage-based billing:** Legacy only (Enterprise and legacy Creator through Business plans). Toggled under **Subscription → Manage Subscription → Usage based billing** with a threshold of **Unlimited** or a custom maximum.
- **Payment methods:** Card, Apple Pay, Google Pay (not in India), and UPI (India). Billing in INR is available for India.
- **Invoices:** Subscription → **Billing** → **View invoices**.
- **Refunds:** Within 14 days, and only if no credits were used.
- **Pausing:** Not possible.
- **Plan periods:** Annual plans are available on all tiers. There are no quarterly plans.
- **Free regenerations:** 2 per prompt in the TTS/Voice Changer web UI (same prompt, voice and model, within 2 hours) and 2 in Studio. With v3, each Generate returns 2 alternatives and charges for one.

---

### 4. Account and workspace UI

#### 4.1 Top-level structure (web app at elevenlabs.io/app)

**Platform/product areas:** ElevenCreative, ElevenAgents (`/app/agents`), and developer tools (Developers). The docs say "**Developers** at the bottom of the sidebar in both ElevenAgents and ElevenCreative".

**Left sidebar in ElevenCreative**, rebuilt from doc references and app URLs. [Partly unverified: exact order, grouping and labels]

| Item (as referenced in docs) | URL |
|---|---|
| Home | /app (Home dashboard) [Unverified contents] |
| Text to Speech | /app/speech-synthesis/text-to-speech |
| Voice Changer | /app/voice-changer [Unverified URL] |
| Sound Effects | /app/sound-effects |
| Speech to Text | /app/speech-to-text |
| Voice Isolator | /app/voice-isolator |
| Image & Video | /app/image-video |
| Music | /app/music [Unverified URL] |
| Studio | /app/studio |
| Dubbing | /app/dubbing |
| Flows / Templates | /app/flows, /app/templates (Explore tab for community templates) |
| Voiceover Studio | Docs say it appears "under Audio Tools" in the sidebar |
| Audio Native | /app/audio-native |
| Productions | /app/productions (beta, select users) |
| Voices (My Voices, Explore = Voice Library, Voice Lab) | /app/voice-lab, /app/voice-library |
| Assets | "main navigation menu" |
| Payouts | /app/payouts (in the sidebar) |
| **Developers** (bottom of sidebar) | /app/developers. Tabs: **API Keys**, **Analytics** (API Requests, Usage, Webhooks), **Request Log**, **Webhooks**, **Top Up** |

- An **Architect** AI assistant sidebar panel is available across the app (ElevenAgents docs).
- **Profile icon (top right) → account menu:**
  - **Settings** (profile): email, **Change Email**, **Add Two-Factor Authentication**, **Default Sharing Preferences**, and a red **Delete Account** button.
  - **Subscription**.
  - **Workspace settings**.
  - Workspace switcher.
  - **Affiliate program**.
  - **ElevenLabs Audio Detector**.
  - **My Account → Payouts**.
  - [Unverified] Sign out, Help/Docs, Discord and the theme toggle are probably here too but weren't confirmed in docs.

#### 4.2 Settings pages [Verified unless marked]

**Profile / Settings** (`/app/settings`):
- Shows the account email.
- **Change Email**: asks for re-verification, sends a link to the new address, and emails the old address a revert link. This isn't possible for Google or Apple SSO accounts.
- **Add Two-Factor Authentication**: shows a QR code, then **Verify & Enable**, then a one-time backup code.
- **Default Sharing Preferences**.
- **Delete Account** (red): confirm by typing your email. The same email can't be reused afterwards.
- Sign-in methods are email/password, Google and Apple. GitHub and Facebook were retired.

**API Keys** (`/app/settings/api-keys`, also the Developers → API Keys tab):
- Create a key with name, permissions (scopes), credit limit, IP allowlist and **Expire After**.
- The table has an **Expires** column.
- Each key can be edited, disabled or deleted.

**Subscription** (`/app/subscription`):
- Monthly/annual toggle and plan cards.
- **Billing** button:
  - **Modify Plan** section with a **Downgrade** dropdown and **Cancel Plan → Proceed → Cancel Subscription**.
  - **Resume subscription** and **Cancel downgrade** buttons.
  - **View invoices**.
  - **Manage billing information**: **Update information** and **Tax ID**.
- **Manage Subscription**:
  - **Enable credit usage notification** toggle with a percentage slider, then **Confirm**. All admins are emailed.
  - **Usage based billing** toggle and **Change threshold** (legacy).

**Usage analytics:** `/app/usage`, now the Developers → Analytics tab (see 2.10).

**Notifications:** Docs only describe the credit-usage email notification (in Subscription), the webhook auto-disable emails to admins, and key-disable emails. [Unverified] A dedicated Notifications settings page isn't documented.

**Workspace settings** (`/app/workspace`). Tabs:
- **General**: Add More Seats / Remove Seats (11 Full Seat cap on self-serve), Enterprise Copying, and copy all resources to another workspace.
- **Members** (`/app/workspace/members`):
  - Invite members and choose a seat type when inviting. Change seat type (Basic / Full / Admin) from a dropdown.
  - Lock members.
  - The shield icon (**Manage User Permissions**) assigns the **User Manager** and **Resource Manager** roles (Enterprise), then **Save Changes**.
- **Groups**:
  - User groups (admin only, not nested, permissions are the union across groups).
  - Disable features by removing a permission from the **Everyone** group, then granting it to specific groups.
  - Billing groups: **Create New Group** with Credit Usage and PVC caps. Each user can be in only one billing group.
- **Service Accounts**: create or delete accounts and issue keys.
- **Security & SSO** (Enterprise):
  - **Allowed Identity Providers**.
  - **User Auto Provisioning**: domain verification by DNS TXT record, then **Verify**.
  - **SSO Provider**: SAML or OIDC, then **Update SSO**, then **Add Domain**. Only SP-initiated sign-in at `/app/sign-in?use_sso=true`.
  - **SCIM**.
- **Model Approvals** (`/app/workspace/model-approvals`, Enterprise): toggles for image and video models, then **Save Changes**.
- **Resources** (`/app/workspace/resources`): a **Copy Resource to Another Workspace** icon on each item.
- Webhooks are configured in Developers → Webhooks; older docs say the "general settings page".

**Roles and seats:**
- **Workspace owner:** one per workspace, and transferable.
- **Admin:** always a Full Seat.
- **Full Seat:** unlimited ElevenCreative use from the shared pool.
- **Basic Seat:** ElevenAgents and API are uncapped. ElevenCreative is capped at **50,000 credits per user per cycle** ($5 on Enterprise).
- **Member roles** (Enterprise): User Manager and Resource Manager.
- **Resource sharing roles:** Viewer, Editor and Admin.
- **Sharing principals:** a user, a group or a service account, with at most 100 principals per resource.
- **Shareable resources:** voices, pronunciation dictionaries, dubbings, projects, auth connections, files and folders, and agents (along with their KB docs, tools, settings, secrets, phone numbers, MCP servers, batch calls, tests and WhatsApp accounts).
- **Multi-workspace:** a user can be in several workspaces and switch between them from the account menu. Only one free workspace is allowed per user.

**Audit logs:** Enterprise only. API only, in OCSF v1.6.0 schema. Event classes 3001, 3002, 3004, 3005 and 3006.

**Consolidated billing:** Shared credit pools across workspaces (Enterprise).

#### 4.3 Home dashboard and History

- **Home** [Unverified]: docs don't describe its widgets. After signup, users land on the TTS (Speech Synthesis) page.
- **History:** There is no standalone history page in the docs. History is a tab in the right panel of the TTS and Voice Changer pages; on narrow screens it's an icon above **Generate speech**. Image & Video, Music and Studio exports each have their own **History** tab. The API is `/v1/history`.

#### 4.4 Affiliate program [Verified]

- Up to **22% commission** on payments for the first **12 months** per referred subscriber. Runs on **PartnerStack**.
- Join through the account menu: **Affiliate program → Sign up for the affiliate program**. You then get a referral link.
- Approved affiliates can get custom links.
- Commission becomes "Pending" **90 days** after the sale. Minimum payout is **$5**, paid between the 1st and 15th of the month.
- Contact: affiliates@elevenlabs.io.

#### 4.5 Grants and impact programs [Verified]

- **Startup Grants** (elevenlabs.io/startup-grants):
  - 12 months free, **33M characters**, high concurrency, Scale-level benefits.
  - Eligibility: under 25 employees, a monetization plan, a business email, one application per company, existing Enterprise customers excluded, no products for children.
  - A decision comes within about 1 week.
  - The account reverts to Free at the end of the grant or when the balance drops to 10K credits.
- **VC Partner Program:** Fast-track perks for portfolio companies.
- **Impact Program:** Free licenses for nonprofits and education. Free access for people with permanent speech loss (ALS, MND, head and neck cancer, CP, PSP) through partners such as Bridging Voice and the Scott-Morgan Foundation.
- **Voice Actor Payouts:**
  - Share your PVC in the Voice Library and earn when paid users use it.
  - Choose a notice period, from immediate up to 2 years, and optional **live moderation**.
  - Paid through Stripe Connect every 6 to 8 days, with a ~$10 minimum. W-8/W-9 forms are required.

#### 4.6 Safety and policies [Verified unless marked]

- **Voice Captcha (VoiceCAPTCHA):** For PVC verification you read a prompt aloud within a time limit. API: `GET/POST /v1/voices/pvc/{id}/captcha`. Manual verification is available as a fallback.
- **No-Go Voices:** Blocks cloning and generation with high-risk voices such as celebrities and politicians.
- **Audio Detector** (`/app/audio-detector`; account menu → **ElevenLabs Audio Detector**):
  - Free on all plans when signed in.
  - Checks for ElevenLabs' **inaudible watermark** first, then falls back to the legacy **AI Speech Classifier**.
  - The classifier (elevenlabs.io/ai-speech-classifier) reports 99% precision and 80% recall on unmodified audio and uses only the first minute. It doesn't reliably catch v3 output.
  - Watermarks add no latency and no audible change, and other platforms can't detect them. Third-party models offered through ElevenLabs are generally not watermarked.
- **SynthID detector:** The `synthid_detector` permission appears in the OpenAPI and group-permission enums. [Unverified] There's no doc page for it.
- **C2PA:** ElevenLabs is a C2PA adopter, and it has been paired with VoiceCAPTCHA for a Japanese voice-actor initiative. [Partly unverified] No docs describe C2PA manifests on exports.
- **Watermarks on free output:** Free-plan dubs and Studio video exports are visibly watermarked.
- **Policies:** Prohibited Use Policy (elevenlabs.io/use-policy), Terms, Privacy Policy, Voice Library Addendum (vla), and Music Marketplace Addendum (mma).
- **Free tier abuse protection:** One free account per user and IP. A VPN can trigger "Unusual activity detected. Free Tier usage disabled".
- **Compliance:** SOC 2, GDPR, HIPAA (BAA), and an OCSF audit log.

---

### 5. Other apps and integrations

#### 5.1 ElevenReader [Verified: help center]

- **Purpose:** A text-to-audio reader app at elevenreader.io. It is a **separate account** from elevenlabs.io.
- **Platforms:** iPhone and iPad (iOS/iPadOS 17+), Android 7+ (rooted devices not supported), and web/desktop. Supports 32 languages.
- **Adding content:**
  - **Write text**, **Scan text** (camera), **Paste a link**, **Upload a file** (.epub, .pdf, .txt, .html, .docx).
  - Also Google Docs, Kindle, X threads and news.
  - Files can be up to 500 pages.
- **Plans:**
  - **Free:** 10 hours per month.
  - **Ultra:** Up to 24 hours per day of your own content, 20 hours per month of premium audiobooks, offline downloads (20 hours/day and 150 hours/month; downloads last 60 days), and **Voice Design** custom narrator voices.
  - Hour packs can be bought; they expire after 12 months.
  - Referral bonus hours. Student and educator discount (age 16+).
  - Ultra promotions are offered through telcos and banks.
  - [Unverified] Prices aren't in the docs; see elevenreader.io/pricing.
- **Voices:** Hundreds of curated voices plus **Iconic Voices**. Cloned voices aren't supported.
- **Voice Chat:** A beta feature for talking about what you're reading.
- **Limits:** Audio can't be downloaded or exported, and there's no commercial use.
- **ElevenReader Publishing:** Authors can publish books with AI narration and earn payouts.
- **ElevenReader Chrome extension:**
  - Imports pages, including paywalled ones when logged in.
  - Auto-imports ePUBs and prompts before importing PDF/TXT.
  - Highlighting more than 1,000 characters triggers an import prompt.
  - **Add Next Chapter** bulk-imports chapters.
  - **Listen Now** plays on elevenreader.io.

#### 5.2 ElevenLabs mobile app ("ElevenLabs: AI Voice Generator") [Verified]

- Available on iOS (App Store id6743162587) and Android (`io.elevenlabs.coreapp`). Uses the same account as the web.
- **Features:** TTS (including Eleven v4), Instant Voice Cloning, Voice Library, Voice Changer, Voice Isolator, Image & Video, Voice Design, and playback and library.
- Audio can be exported to CapCut, iMovie or Instagram.
- **Web only:** PVC, Studio, Dubbing, Eleven Music and Agents.
- **Billing:** 10,000 free credits per month. App-store subscriptions are managed by Apple or Google, and PAYG isn't available for them. To move to Stripe, cancel the app subscription, wait for it to expire, then resubscribe on the web.

#### 5.3 ElevenMusic app [Verified]

- A separate product with a separate account: an iOS app (id6755965224) and elevenmusic.io. It is not the same as ElevenCreative Music.
- **Features:** Discover, create and remix tracks, all built on the ElevenLabs Music model.
- **Free plan:** 5 tracks per day.
- **Pro plan:** 400 tracks per month, more storage, style packs, stem separation, 10 HQ WAV downloads per month, cover art, song analytics and royalties.
- **Music Marketplace** (inside ElevenCreative):
  - **Licenses:** Social Media, Paid Marketing, Offline, and Enterprise. Distribution to streaming services is forbidden.
  - **Creators:** Earn 25% or more of each sale. Up to 5 uploads per day.

#### 5.4 Browser extensions

- **ElevenReader Chrome extension:** Verified (see 5.1).
- [Unverified] A separate "ElevenLabs" TTS Chrome extension isn't referenced in current docs.

#### 5.5 Integrations

- **Official docs integrations:**
  - Audio Native embed for React, Ghost, Squarespace, Framer, Webflow, WordPress and Wix.
  - Agents telephony: Twilio, Exotel, SIP trunk and WhatsApp.
  - LiveKit and Pipecat (Speech Engine).
  - Vercel AI SDK, Supabase (streaming and caching guide), and Twilio TTS sending.
  - Telegram bot cookbook.
  - Hosted MCP for Claude and other MCP clients. Data residency SDK environments.
- **Reception.ai** (ElevenLabs' AI receptionist product, in the docs): integrations with Google Calendar, Calendly, Cal.com, HubSpot, **Zapier**, webhooks and MCP.
- **Third-party no-code tools** [Unverified, third-party sources]:
  - Zapier offers an ElevenLabs app with about 2 actions and no triggers.
  - Make offers ElevenLabs modules (synthesize speech, agents, voices).
  - n8n works through HTTP nodes.
- **Third-party services** connect with your API key from Developers → API Keys. Voices may not be accessible through third parties.
- **Community:** Discord. There's also an AI support chatbot in the docs and help center (built on ElevenAgents) and support@elevenlabs.io.

---

### 6. Notable recent changes (changelog, Aug to Oct 2026)

- **2026-10-05:** Structured procedures compile on save. Merge proposals in alpha.
- **2026-09-28:**
  - **Eleven v4 / v4 Turbo** launched: 90+ languages, about 100 ms for Turbo, available through Text to Dialogue and its WebSocket.
  - **STT transcript editing** for batch and realtime.
  - New Flows Template API.
  - New agent LLMs: gpt-6-sol/luna, claude-opus-5 / 5-5 and others.
- **2026-09-23:** Sora 2 / 2 Pro retired from Image & Video. Seedance 1.5 Pro is deprecated, with the shutdown on Nov 11.
- **2026-09-21:** Parallel tool calls, Slack alerting, GPT Image 2.5 models, and Speech Engine `cascade_timeout_seconds`.
- **2026-09-14:** Agent call queueing with hold audio. Music API now accepts `music_v2_5`.
- **2026-09-11:** **Scribe v2 Medical GA**.
- **2026-09-07:** Enterprise `platform_limits` on service-account keys. Workspace-wide triage tickets.
- **2026-08-17:** Async Flows APIs (image, video, speech generation) and the Assets API.

---

### 7. Open questions / unverified items

1. Exact left-sidebar order and labels, and Home dashboard widgets (rebuilt from doc references, not observed).
2. Whether the STT upload modal exposes diarization or speaker-count controls today.
3. A dedicated Notifications settings page (not documented).
4. Entity detection, forced alignment and Image/Video API dollar pricing (not shown on pricing pages).
5. Conflicts:
   - STT maximum file size: 3 GB (docs) vs 5 GB (OpenAPI).
   - Multichannel duration limit: 10 hours vs 1 hour.
   - Business concurrency: 25 (pricing) vs 15 (models page).
   - Keyterm limit and price in the STT FAQ (100 terms, +20%) vs the current docs and pricing (1,000 terms, $/h add-on).
6. The local `elevenlabs-mcp` tool list and version (third-party sources).
7. ElevenReader and ElevenMusic Pro prices (not in docs).
8. C2PA metadata on ElevenLabs exports, and the SynthID detector feature (only an enum appears).

---

### Sources

- https://elevenlabs.io/docs/llms.txt
- https://api.elevenlabs.io/openapi.json
- https://elevenlabs.io/docs/overview/capabilities/speech-to-text
- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/eleven-creative/playground/speech-to-text
- https://elevenlabs.io/docs/eleven-creative/products/transcripts
- https://elevenlabs.io/docs/eleven-creative/products/subtitles
- https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/keyterm-prompting
- https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/entity-detection
- https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/webhooks
- https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/transcripts-and-commit-strategies
- https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/event-reference
- https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
- https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input
- https://elevenlabs.io/docs/api-reference/tokens/create
- https://elevenlabs.io/docs/api-reference/introduction
- https://elevenlabs.io/docs/api-reference/authentication
- https://elevenlabs.io/docs/api-reference/streaming
- https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tts
- https://elevenlabs.io/docs/eleven-api/resources/libraries
- https://elevenlabs.io/docs/eleven-api/resources/agent-tooling
- https://elevenlabs.io/docs/eleven-api/resources/errors
- https://elevenlabs.io/docs/eleven-api/resources/webhooks
- https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode
- https://elevenlabs.io/docs/eleven-agents/operate/cli
- https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp
- https://elevenlabs.io/docs/overview/administration/data-residency
- https://elevenlabs.io/docs/overview/administration/billing
- https://elevenlabs.io/docs/overview/administration/pay-as-you-go
- https://elevenlabs.io/docs/overview/administration/account
- https://elevenlabs.io/docs/overview/administration/usage-analytics
- https://elevenlabs.io/docs/overview/administration/assets
- https://elevenlabs.io/docs/overview/administration/workspaces/overview
- https://elevenlabs.io/docs/overview/administration/workspaces/members
- https://elevenlabs.io/docs/overview/administration/workspaces/api-keys
- https://elevenlabs.io/docs/overview/administration/workspaces/service-accounts
- https://elevenlabs.io/docs/overview/administration/workspaces/sharing-resources
- https://elevenlabs.io/docs/overview/administration/workspaces/user-groups
- https://elevenlabs.io/docs/overview/administration/workspaces/billing-groups
- https://elevenlabs.io/docs/overview/administration/workspaces/sso
- https://elevenlabs.io/docs/overview/administration/workspaces/audit-logs
- https://elevenlabs.io/docs/overview/administration/workspaces/model-approvals
- https://elevenlabs.io/docs/eleven-creative/overview
- https://elevenlabs.io/docs/eleven-creative/quickstart
- https://elevenlabs.io/docs/eleven-creative/audio-tools/audio-detector
- https://elevenlabs.io/docs/help-center/product/mobile-apps/eleven-reader (and child articles)
- https://elevenlabs.io/docs/help-center/product/mobile-apps/eleven-labs-for-ios-and-android (and child articles)
- https://elevenlabs.io/docs/help-center/product/mobile-apps/eleven-music (and child articles)
- https://elevenlabs.io/docs/help-center/legal/audio-detector (and child articles)
- https://elevenlabs.io/docs/help-center/partnerships (and child articles)
- https://elevenlabs.io/docs/help-center/website/can-i-access-the-files-i-generated-in-the-past
- https://elevenlabs.io/docs/changelog/llms.txt and entries 2026/8/17 to 2026/10/5
- https://elevenlabs.io/pricing
- https://elevenlabs.io/pricing/api
- https://elevenlabs.io/startup-grants
- https://elevenlabs.io/affiliates
- https://elevenlabs.io/safety
- https://elevenlabs.io/ai-speech-classifier
- https://elevenlabs.io/blog/introducing-elevenlabs-mcp
- https://hub.docker.com/mcp/server/elevenlabs/manual (third-party)
- https://glama.ai/mcp/servers/elevenlabs/elevenlabs-mcp (third-party)
- https://zapier.com/es/apps/elevenlabs/integrations (third-party)
- https://www.make.com/en/integrations/elevenlabs/zapier (third-party)
- https://respawn.outlookindia.com/pop-culture/pop-culture-news/elevenlabs-brings-new-tech-to-protect-japans-anime-voices (third-party, C2PA/VoiceCAPTCHA)


---

