import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { useData } from '../context/DataContext';
import { cx } from '../lib/utils';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface Endpoint {
  method: Method;
  path: string;
  title: string;
  description: string;
  curl: (base: string, voiceId: string) => string;
  returns: string;
}

interface Group {
  title: string;
  endpoints: Endpoint[];
}

const GROUPS: Group[] = [
  {
    title: 'System',
    endpoints: [
      { method: 'GET', path: '/v1/health', title: 'Health', description: 'Server, queue and engine status. Always public.', returns: '{"status":"ok","version":"1.0.0","auth":false,"queue":{...},"engines":{...}}', curl: (b) => `curl ${b}/v1/health` },
      { method: 'GET', path: '/v1/models', title: 'List models', description: 'Text-to-speech models (omnivoice, kokoro, pocket) with capabilities, languages and their voice_settings schema.', returns: '[{"model_id":"kokoro","settings":[...],"can_clone":false, ...}]', curl: (b) => `curl ${b}/v1/models` },
      { method: 'GET', path: '/v1/speech-to-text/models', title: 'List STT models', description: 'Whisper sizes available for transcription.', returns: '[{"model_id":"whisper-small","default":true, ...}]', curl: (b) => `curl ${b}/v1/speech-to-text/models` },
      {
        method: 'POST',
        path: '/v1/auth/login',
        title: 'Log in',
        description: 'Only when the server sets NOLABS_API_KEY. API clients can instead send the key in an xi-api-key header on every request.',
        returns: '{"status":"ok"} + session cookie',
        curl: (b) => `curl -X POST ${b}/v1/auth/login -H "Content-Type: application/json" -d '{"key": "YOUR_KEY"}'`,
      },
    ],
  },
  {
    title: 'Text to Speech',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/text-to-speech/{voice_id}',
        title: 'Convert text to speech',
        description: 'Returns audio bytes. The model is the voice\'s own model (model_id is optional). voice_settings keys come from that model\'s settings in /v1/models, e.g. omnivoice: speed, quality; kokoro: speed; pocket: temperature. Response headers include history-item-id, x-audio-url, x-duration-seconds and x-model-id. Max 5,000 characters.',
        returns: 'audio/mpeg or audio/wav',
        curl: (b, v) => `curl -X POST ${b}/v1/text-to-speech/${v} \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello from NO LABS!",
    "voice_settings": {"speed": 1.0},
    "output_format": "mp3_44100_128"
  }' \\
  --output speech.mp3`,
      },
      {
        method: 'POST',
        path: '/v1/text-to-speech/{voice_id}/stream',
        title: 'Stream speech',
        description:
          'Same JSON body as above, but the MP3 is streamed (chunked) sentence by sentence while it generates, so playback can start after the first sentence. ElevenLabs-compatible. Use curl -N to disable buffering.',
        returns: 'audio/mpeg (chunked)',
        curl: (b, v) => `curl -N -X POST ${b}/v1/text-to-speech/${v}/stream \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello from NO LABS! This plays while it is generated."}' \\
  --output - | ffplay -nodisp -autoexit -

# or save it:  ... --output speech.mp3`,
      },
      {
        method: 'POST',
        path: '/v1/text-to-speech/{voice_id}/stream-session',
        title: 'Create a stream session',
        description:
          'Validates the request (same JSON body) and returns a one-time stream_url you can put straight into an <audio> src. The URL streams MP3 while generating, works once, and expires after 10 minutes. When generation finishes, the item appears at GET /v1/history/{history_item_id} and the identical file is served at audio_url.',
        returns: '{"stream_url":"/v1/streams/<token>","history_item_id":"h_...","audio_url":"/files/out/h_....mp3","model_id":"kokoro"}',
        curl: (b, v) => `curl -X POST ${b}/v1/text-to-speech/${v}/stream-session \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello from NO LABS!"}'

# then play the returned stream_url once:
curl -N ${b}/v1/streams/TOKEN --output - | ffplay -nodisp -autoexit -`,
      },
    ],
  },
  {
    title: 'Voices',
    endpoints: [
      { method: 'GET', path: '/v1/voices', title: 'List voices', description: 'Optional query params: search, category (premade | cloned | generated), model_id, language (ISO code).', returns: '{"voices":[Voice, ...]}', curl: (b) => `curl "${b}/v1/voices?model_id=kokoro&language=en"` },
      { method: 'GET', path: '/v1/voices/{voice_id}/preview', title: 'Voice preview', description: 'A short sample clip (rendered on first request, then cached).', returns: 'audio/wav', curl: (b, v) => `curl ${b}/v1/voices/${v}/preview --output preview.wav` },
      { method: 'GET', path: '/v1/voices/{voice_id}', title: 'Get voice', description: 'Fetch a single voice.', returns: 'Voice', curl: (b, v) => `curl ${b}/v1/voices/${v}` },
      {
        method: 'PATCH',
        path: '/v1/voices/{voice_id}',
        title: 'Edit voice',
        description: 'Update name, description or labels.',
        returns: 'Voice',
        curl: (b, v) => `curl -X PATCH ${b}/v1/voices/${v} \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Narrator", "labels": {"accent": "british"}}'`,
      },
      { method: 'DELETE', path: '/v1/voices/{voice_id}', title: 'Delete voice', description: 'Default (premade) voices cannot be deleted.', returns: '{"status":"ok"}', curl: (b, v) => `curl -X DELETE ${b}/v1/voices/${v}` },
      {
        method: 'POST',
        path: '/v1/voices/add',
        title: 'Instant Voice Clone',
        description: 'Multipart upload. 3–20 seconds of clean speech works best. ref_text is auto-transcribed when empty. model_id: omnivoice (default) or pocket when the server enables it.',
        returns: '{"voice_id":"...","voice":Voice}',
        curl: (b) => `curl -X POST ${b}/v1/voices/add \\
  -F name="My voice" \\
  -F description="Calm narrator" \\
  -F files=@sample.wav`,
      },
    ],
  },
  {
    title: 'Voice Design',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/text-to-voice/create-previews',
        title: 'Create previews',
        description: 'Comma-separated attributes: gender, age, pitch, accent, whisper. Returns 3 previews.',
        returns: '{"previews":[{"generated_voice_id":"g_...","audio_url":"/files/...","duration_secs":4.2}]}',
        curl: (b) => `curl -X POST ${b}/v1/text-to-voice/create-previews \\
  -H "Content-Type: application/json" \\
  -d '{"voice_description": "female, low pitch, british accent"}'`,
      },
      {
        method: 'POST',
        path: '/v1/text-to-voice/create-voice-from-preview',
        title: 'Save a preview',
        description: 'Save a generated preview as a voice (category "generated").',
        returns: 'Voice',
        curl: (b) => `curl -X POST ${b}/v1/text-to-voice/create-voice-from-preview \\
  -H "Content-Type: application/json" \\
  -d '{"generated_voice_id": "g_...", "voice_name": "Ivy", "voice_description": "female, low pitch, british accent"}'`,
      },
    ],
  },
  {
    title: 'Speech to Text',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/speech-to-text',
        title: 'Transcribe',
        description: 'Multipart. model_id: whisper-base | whisper-small | whisper-medium | whisper-large-v3-turbo. timestamps_granularity: word | segment. Up to 2 hours.',
        returns: '{"text":"...","language_code":"en","segments":[...],"words":[...]}',
        curl: (b) => `curl -X POST ${b}/v1/speech-to-text \\
  -F file=@meeting.mp3 \\
  -F model_id=whisper-small \\
  -F timestamps_granularity=segment`,
      },
    ],
  },
  {
    title: 'Audio tools',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/speech-to-speech/{voice_id}',
        title: 'Voice Changer',
        description: 'Re-voice a recording in the target voice, keeping the duration.',
        returns: 'audio bytes',
        curl: (b, v) => `curl -X POST ${b}/v1/speech-to-speech/${v} \\
  -F audio=@input.wav \\
  -F 'voice_settings={"speed":1.0,"quality":16}' \\
  --output changed.mp3`,
      },
      {
        method: 'POST',
        path: '/v1/audio-isolation',
        title: 'Voice Isolator',
        description: 'Remove background audio, keeping vocals only.',
        returns: 'audio bytes',
        curl: (b) => `curl -X POST ${b}/v1/audio-isolation \\
  -F audio=@noisy.mp3 \\
  --output clean.mp3`,
      },
      {
        method: 'POST',
        path: '/v1/sound-generation',
        title: 'Sound Effects',
        description: 'duration_seconds 1–10, prompt_influence 0–1.',
        returns: 'audio bytes',
        curl: (b) => `curl -X POST ${b}/v1/sound-generation \\
  -H "Content-Type: application/json" \\
  -d '{"text": "glass shattering on concrete", "duration_seconds": 5, "prompt_influence": 0.3}' \\
  --output sfx.mp3`,
      },
      {
        method: 'POST',
        path: '/v1/music',
        title: 'Music',
        description: 'music_length_ms 5000–30000.',
        returns: 'audio bytes',
        curl: (b) => `curl -X POST ${b}/v1/music \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "lofi hip hop beat, mellow piano", "music_length_ms": 15000}' \\
  --output music.mp3`,
      },
    ],
  },
  {
    title: 'History',
    endpoints: [
      { method: 'GET', path: '/v1/history', title: 'List history', description: 'Optional: kind (tts | stt | voice_changer | isolation | sfx | music), limit (default 50). Newest first.', returns: '{"history":[HistoryItem, ...]}', curl: (b) => `curl "${b}/v1/history?kind=tts&limit=20"` },
      {
        method: 'GET',
        path: '/v1/history/{history_item_id}',
        title: 'Get history item',
        description: 'A single item. For a streamed generation this returns 404 until the stream has finished, then the item with duration_secs and audio_url, so you can poll it.',
        returns: 'HistoryItem',
        curl: (b) => `curl ${b}/v1/history/h_123`,
      },
      { method: 'DELETE', path: '/v1/history/{history_item_id}', title: 'Delete history item', description: 'Removes the item and its audio.', returns: '{"status":"ok"}', curl: (b) => `curl -X DELETE ${b}/v1/history/h_123` },
    ],
  },
];

const METHOD_TONE: Record<Method, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  POST: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-2xs font-medium text-zinc-400 hover:text-white hover:bg-white/10"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {ok ? <Check size={12} /> : <Copy size={12} />} {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ApiPage() {
  const { voices } = useData();
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const voiceId = voices.find((v) => v.category === 'premade')?.voice_id ?? voices[0]?.voice_id ?? 'VOICE_ID';
  const nav = useMemo(() => GROUPS.map((g) => ({ id: g.title.toLowerCase().replace(/\s+/g, '-'), title: g.title })), []);

  return (
    <PageShell title="API reference" description="NO LABS exposes an ElevenLabs-compatible /v1 REST API. No key is needed unless the server sets NOLABS_API_KEY; then send it as an xi-api-key header.">
      <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xs uppercase tracking-wider text-faint font-medium">Base URL</p>
          <code className="text-sm font-mono break-all">{base}</code>
        </div>
        <p className="text-xs text-sub sm:max-w-xs">
          Errors return <code className="font-mono">{'{"detail":{"status","message"}}'}</code>. Generated files are served from{' '}
          <code className="font-mono">/files/…</code>.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        {nav.map((n) => (
          <a key={n.id} href={`#${n.id}`} className="chip h-7 text-xs">
            {n.title}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-10">
        {GROUPS.map((g) => (
          <section key={g.title} id={g.title.toLowerCase().replace(/\s+/g, '-')} className="scroll-mt-4">
            <h3 className="text-lg font-semibold tracking-tight mb-3">{g.title}</h3>
            <div className="flex flex-col gap-4">
              {g.endpoints.map((e) => {
                const curl = e.curl(base, voiceId);
                return (
                  <article key={e.method + e.path} className="card overflow-hidden">
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cx('inline-flex items-center h-5 px-1.5 rounded text-2xs font-bold tracking-wide', METHOD_TONE[e.method])}>{e.method}</span>
                        <code className="text-sm font-mono font-medium break-all">{e.path}</code>
                      </div>
                      <p className="text-sm font-medium mt-2">{e.title}</p>
                      <p className="text-xs text-sub mt-0.5">{e.description}</p>
                      <p className="text-2xs text-faint mt-2">
                        Returns: <code className="font-mono break-all">{e.returns}</code>
                      </p>
                    </div>
                    <div className="bg-zinc-950 dark:bg-black border-t border-line">
                      <div className="flex items-center justify-between px-3 h-9 border-b border-white/10">
                        <span className="text-2xs font-medium text-zinc-400">cURL</span>
                        <CopyButton text={curl} label={`Copy curl for ${e.title}`} />
                      </div>
                      <pre className="px-4 py-3 text-xs leading-relaxed text-zinc-100 font-mono overflow-x-auto scrollbar-thin">
                        <code>{curl}</code>
                      </pre>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
