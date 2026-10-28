// NO LABS API client. All URLs are relative so the same build works behind the
// Vite dev proxy and behind nginx. No timeouts: CPU inference can be slow.

export type VoiceCategory = 'premade' | 'cloned' | 'generated';

export interface Voice {
  voice_id: string;
  name: string;
  category: VoiceCategory;
  /** TTS model this voice belongs to (v1 servers omit it: treat as omnivoice). */
  model_id?: string | null;
  language?: string | null;
  accent?: string | null;
  description?: string | null;
  labels?: Record<string, string> | null;
  preview_url?: string | null;
  created_at?: string | null;
}

export type EngineState = 'loaded' | 'idle' | 'unavailable' | string;

export interface ModelLanguage {
  language_id: string;
  name: string;
}

/** One tunable value of a model, rendered generically as a slider and sent in `voice_settings`. */
export interface ModelSetting {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  left?: string;
  right?: string;
  hint?: string;
}

export interface Model {
  model_id: string;
  name: string;
  description?: string;
  speed?: 'slow' | 'fast' | 'fastest' | string;
  languages?: ModelLanguage[];
  can_clone?: boolean;
  can_design?: boolean;
  voice_count?: number;
  status?: EngineState;
  settings?: ModelSetting[];
}

export interface SttModel {
  model_id: string;
  name: string;
  description?: string;
  default?: boolean;
}

export interface Health {
  status: string;
  version?: string;
  device?: string;
  auth?: boolean;
  queue?: { running: number; waiting: number; max_waiting?: number };
  engines?: Record<string, EngineState>;
}

export type HistoryKind = 'tts' | 'stt' | 'voice_changer' | 'isolation' | 'sfx' | 'music';

export interface HistoryItem {
  history_item_id: string;
  kind: HistoryKind;
  text?: string | null;
  voice_id?: string | null;
  voice_name?: string | null;
  model_id?: string | null;
  audio_url?: string | null;
  source_url?: string | null;
  duration_secs?: number | null;
  settings?: Record<string, unknown> | null;
  created_at: string;
}

/** Keys come from the model's `settings` schema. */
export type VoiceSettings = Record<string, number>;

export type OutputFormat = 'mp3_44100_128' | 'wav_24000';

export interface TtsBody {
  text: string;
  model_id?: string;
  language_code?: string | null;
  voice_settings: VoiceSettings;
  output_format: OutputFormat;
}

export interface StreamSession {
  stream_url: string;
  history_item_id: string;
  audio_url: string;
  model_id?: string;
}

export interface AudioResult {
  blob: Blob;
  objectUrl: string;
  audioUrl: string | null;
  historyItemId: string | null;
  duration: number | null;
  contentType: string;
}

export interface VoicePreview {
  generated_voice_id: string;
  audio_url: string;
  duration_secs?: number;
}

export interface SttSegment {
  start: number;
  end: number;
  text: string;
}
export interface SttWord {
  text: string;
  start: number;
  end: number;
}
export interface SttResult {
  language_code?: string | null;
  language_probability?: number | null;
  text: string;
  duration?: number | null;
  segments?: SttSegment[];
  words?: SttWord[];
  history_item_id?: string | null;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function toError(res: Response): Promise<ApiError> {
  let message = `${res.status} ${res.statusText || 'Request failed'}`;
  let code = String(res.status);
  try {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      const d = data?.detail;
      if (typeof d === 'string') message = d;
      else if (d && typeof d === 'object' && !Array.isArray(d)) {
        if (d.message) message = String(d.message);
        if (d.status) code = String(d.status);
      } else if (Array.isArray(d) && d.length) {
        // FastAPI validation error shape
        message = d.map((e: { msg?: string; loc?: unknown[] }) => `${(e.loc ?? []).slice(1).join('.')}: ${e.msg}`).join('; ');
        code = 'validation_error';
      } else if (data?.message) message = String(data.message);
    } catch {
      // Non-JSON 5xx usually comes from the dev proxy / nginx when the API is down.
      if (res.status >= 500 && (!text || /ECONNREFUSED|<html|bad gateway/i.test(text))) {
        return new ApiError('Could not reach the NO LABS server. Is the backend running?', res.status, 'network_error');
      }
      if (text && text.length < 300) message = text;
    }
  } catch {
    /* ignore */
  }
  if (res.status === 429 && (code === 'server_busy' || code === '429')) {
    return new ApiError('The server is busy with other jobs, try again in a moment.', 429, 'server_busy');
  }
  return new ApiError(message, res.status, code);
}

/* ---------- Auth ---------- */
// When the server has an access key set, a 401 `unauthorized` asks the registered handler (the global
// "Enter access key" modal) to sign in. It resolves true once a session cookie is set, and the request is retried.
type UnauthorizedHandler = () => Promise<boolean>;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let pendingAuth: Promise<boolean> | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  unauthorizedHandler = fn;
}

function waitForAuth(): Promise<boolean> {
  if (!unauthorizedHandler) return Promise.resolve(false);
  if (!pendingAuth) pendingAuth = unauthorizedHandler().finally(() => (pendingAuth = null));
  return pendingAuth;
}

async function request(path: string, init?: RequestInit, retried = false): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: 'same-origin', ...init });
  } catch (e) {
    throw new ApiError(
      'Could not reach the NO LABS server. Is the backend running?',
      0,
      'network_error',
    );
  }
  if (!res.ok) {
    const err = await toError(res);
    if (err.status === 401 && err.code === 'unauthorized' && !retried && !path.startsWith('/v1/auth/')) {
      if (await waitForAuth()) return request(path, init, true);
    }
    throw err;
  }
  return res;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init);
  return (await res.json()) as T;
}

function jsonBody(body: unknown, method = 'POST'): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

async function audio(path: string, init: RequestInit): Promise<AudioResult> {
  const res = await request(path, init);
  const blob = await res.blob();
  const dur = res.headers.get('x-duration-seconds');
  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    audioUrl: res.headers.get('x-audio-url'),
    historyItemId: res.headers.get('history-item-id'),
    duration: dur ? Number(dur) : null,
    contentType: res.headers.get('content-type') ?? blob.type,
  };
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  health: () => json<Health>('/v1/health'),
  models: () => json<Model[]>('/v1/models'),
  sttModels: () => json<SttModel[]>('/v1/speech-to-text/models'),
  login: (key: string) => json<{ status: string }>('/v1/auth/login', jsonBody({ key })),
  logout: () => json<{ status: string }>('/v1/auth/logout', { method: 'POST' }),

  voices: async (params: { search?: string; category?: string; model_id?: string; language?: string } = {}) =>
    (await json<{ voices: Voice[] }>(`/v1/voices${qs(params)}`)).voices ?? [],
  voice: (id: string) => json<Voice>(`/v1/voices/${encodeURIComponent(id)}`),
  updateVoice: (id: string, patch: Partial<Pick<Voice, 'name' | 'description' | 'labels'>>) =>
    json<Voice>(`/v1/voices/${encodeURIComponent(id)}`, jsonBody(patch, 'PATCH')),
  deleteVoice: (id: string) => json<{ status: string }>(`/v1/voices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  addVoice: (input: {
    name: string;
    description?: string;
    labels?: Record<string, string>;
    ref_text?: string;
    model_id?: string;
    files: (File | Blob)[];
  }) => {
    const fd = new FormData();
    fd.append('name', input.name);
    if (input.description) fd.append('description', input.description);
    if (input.labels && Object.keys(input.labels).length) fd.append('labels', JSON.stringify(input.labels));
    if (input.ref_text) fd.append('ref_text', input.ref_text);
    if (input.model_id) fd.append('model_id', input.model_id);
    input.files.forEach((f, i) => {
      const name = f instanceof File ? f.name : `recording-${i + 1}.${extFor(f.type)}`;
      fd.append('files', f, name);
    });
    return json<{ voice_id: string; voice: Voice }>('/v1/voices/add', { method: 'POST', body: fd });
  },

  createPreviews: (voice_description: string, text?: string) =>
    json<{ previews: VoicePreview[] }>(
      '/v1/text-to-voice/create-previews',
      jsonBody({ voice_description, ...(text ? { text } : {}) }),
    ),
  createVoiceFromPreview: (generated_voice_id: string, voice_name: string, voice_description: string) =>
    json<Voice>(
      '/v1/text-to-voice/create-voice-from-preview',
      jsonBody({ generated_voice_id, voice_name, voice_description }),
    ),

  tts: (voiceId: string, body: TtsBody) => audio(`/v1/text-to-speech/${encodeURIComponent(voiceId)}`, jsonBody(body)),
  /** Validates and queues a streamed generation; play `stream_url` (one-time, MP3) right away. */
  ttsStreamSession: (voiceId: string, body: TtsBody) =>
    json<StreamSession>(`/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream-session`, jsonBody(body)),

  stt: (input: { file: File | Blob; language_code?: string; model_id?: string; timestamps_granularity?: 'word' | 'segment' }) => {
    const fd = new FormData();
    fd.append('file', input.file, input.file instanceof File ? input.file.name : `audio.${extFor(input.file.type)}`);
    if (input.language_code) fd.append('language_code', input.language_code);
    if (input.model_id) fd.append('model_id', input.model_id);
    fd.append('timestamps_granularity', input.timestamps_granularity ?? 'segment');
    return json<SttResult>('/v1/speech-to-text', { method: 'POST', body: fd });
  },

  speechToSpeech: (voiceId: string, file: File | Blob, settings: VoiceSettings) => {
    const fd = new FormData();
    fd.append('audio', file, file instanceof File ? file.name : `audio.${extFor(file.type)}`);
    fd.append('voice_settings', JSON.stringify(settings));
    return audio(`/v1/speech-to-speech/${encodeURIComponent(voiceId)}`, { method: 'POST', body: fd });
  },

  isolate: (file: File | Blob) => {
    const fd = new FormData();
    fd.append('audio', file, file instanceof File ? file.name : `audio.${extFor(file.type)}`);
    return audio('/v1/audio-isolation', { method: 'POST', body: fd });
  },

  soundEffect: (text: string, duration_seconds: number, prompt_influence: number) =>
    audio('/v1/sound-generation', jsonBody({ text, duration_seconds, prompt_influence })),

  music: (prompt: string, music_length_ms: number) => audio('/v1/music', jsonBody({ prompt, music_length_ms })),

  history: async (params: { kind?: string; limit?: number } = {}) =>
    (await json<{ history: HistoryItem[] }>(`/v1/history${qs({ limit: 50, ...params })}`)).history ?? [],
  /** 404 (`ApiError.status === 404`) until a streamed generation has finished. */
  historyItem: (id: string) => json<HistoryItem>(`/v1/history/${encodeURIComponent(id)}`),
  deleteHistory: (id: string) =>
    json<{ status: string }>(`/v1/history/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export function extFor(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'bin';
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}
