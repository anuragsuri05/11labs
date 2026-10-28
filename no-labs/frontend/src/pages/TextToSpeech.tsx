import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Download, Globe2, History as HistoryIcon, Laugh, Megaphone, Newspaper, Gamepad2, Brain, X } from 'lucide-react';
import {
  api,
  ApiError,
  errorMessage,
  type HistoryItem,
  type Model,
  type OutputFormat,
  type StreamSession,
  type TtsBody,
  type Voice,
  type VoiceSettings,
} from '../lib/api';
import { useData } from '../context/DataContext';
import { usePlayer, type Track } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { VoicePicker } from '../components/VoicePicker';
import { ModelPicker } from '../components/ModelPicker';
import { ModelSettings } from '../components/ModelSettings';
import { GenerateButton } from '../components/GenerateButton';
import { HistoryList } from '../components/HistoryList';
import { useHistory } from '../lib/hooks';
import { cx, downloadUrl, LANGUAGES, slug } from '../lib/utils';
import { load, loadValue, save } from '../lib/storage';
import { DEFAULT_MODEL, defaultSettings, isMultilingual, resolveSettings, settingsFor, voiceModel } from '../lib/models';

const MAX = 5000;

/** Play audio while it generates (stream-session). False uses the classic one-shot request. */
const STREAMING = true;
const POLL_MS = 1500;
const STREAM_TIMEOUT_MS = 10 * 60_000;

const EXAMPLES = [
  {
    label: 'Narrate a story',
    icon: BookOpen,
    text: "In the ancient land of Eldoria, where the skies shimmered with ethereal light and the rivers whispered secrets to those who would listen, there lived a young cartographer named Lyra. Every map she drew came alive at night, and tonight, one of them had gone missing.",
  },
  {
    label: 'Tell a joke',
    icon: Laugh,
    text: "Why don't scientists trust atoms? Because they make up everything! ... Okay, okay, I've got a better one. I told my wife she was drawing her eyebrows too high. She looked surprised.",
  },
  {
    label: 'Record an ad',
    icon: Megaphone,
    text: "Tired of waking up groggy? Meet Sunrise — the smart alarm that wakes you gently with light and sound, perfectly timed to your sleep cycle. Rise refreshed, every single morning. Try Sunrise free for thirty days.",
  },
  {
    label: 'Speak in different languages',
    icon: Globe2,
    text: "Hello and welcome! Bonjour et bienvenue! Hola y bienvenidos! Today we'll take a short trip around the world, one greeting at a time.",
  },
  {
    label: 'Direct a dramatic movie scene',
    icon: Gamepad2,
    text: "The door creaked open. \"You shouldn't have come back here,\" she whispered, her voice trembling. \"They know who you are now. And they're already on their way.\"",
  },
  {
    label: 'Read the news',
    icon: Newspaper,
    text: "Good evening. Our top story tonight: researchers have unveiled a new open-source speech model that runs entirely on a laptop, bringing natural-sounding voices to anyone, anywhere, for free.",
  },
  {
    label: 'Introduce a podcast',
    icon: Brain,
    text: "Welcome back to Deep Currents, the podcast where we dive beneath the headlines. I'm your host, and today we're asking a simple question with a complicated answer: what makes a voice feel human?",
  },
];

interface Prefs {
  language: string;
  format: OutputFormat;
  /** Slider values per model id. */
  values: Record<string, VoiceSettings>;
}

const DEFAULT_PREFS: Prefs = { language: '', format: 'mp3_44100_128', values: {} };

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export default function TextToSpeechPage() {
  const { voices, voicesLoading, models, bumpHistory } = useData();
  const player = usePlayer();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [text, setText] = useState<string>(() => loadValue('tts-text') ?? '');
  const [voiceId, setVoiceId] = useState<string | null>(() => params.get('voice_id') ?? loadValue('tts-voice'));
  const [modelId, setModelId] = useState<string>(() => loadValue('tts-model') ?? DEFAULT_MODEL);
  // Last voice used with each model, so switching models back and forth keeps your choice.
  const [voiceByModel, setVoiceByModel] = useState<Record<string, string>>(() => load('tts-voices', {} as Record<string, string>));
  const [prefs, setPrefs] = useState<Prefs>(() => load('tts-prefs', DEFAULT_PREFS));
  const [tab, setTab] = useState<'settings' | 'history'>('settings');
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<Track | null>(null);
  /** History id of the generation that is currently streaming (until its file is finished). */
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const pollRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const history = useHistory('tts');

  // Preselect voice from URL (?voice_id=) and clean up the URL.
  useEffect(() => {
    const v = params.get('voice_id');
    if (v) {
      setVoiceId(v);
      params.delete('voice_id');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstVoiceOf = useCallback(
    (m: string) => {
      const remembered = voiceByModel[m];
      if (remembered && voices.some((v) => v.voice_id === remembered && voiceModel(v) === m)) return remembered;
      return voices.find((v) => voiceModel(v) === m)?.voice_id ?? null;
    },
    [voices, voiceByModel],
  );

  // Keep model and voice consistent once data loads (URL voice, deleted voice, unknown model, ...).
  useEffect(() => {
    if (voicesLoading || !voices.length) return;
    const voice = voices.find((v) => v.voice_id === voiceId);
    if (voice) {
      if (voiceModel(voice) !== modelId) setModelId(voiceModel(voice));
      return;
    }
    const modelKnown = !models.length || models.some((m) => m.model_id === modelId);
    if (!modelKnown) {
      const fallback = voices[0];
      setModelId(fallback ? voiceModel(fallback) : models[0].model_id);
      setVoiceId(fallback?.voice_id ?? null);
      return;
    }
    const next = firstVoiceOf(modelId);
    if (next !== voiceId) setVoiceId(next);
  }, [voices, voicesLoading, models, voiceId, modelId, firstVoiceOf]);

  useEffect(() => {
    if (voiceId) save('tts-voice', voiceId);
  }, [voiceId]);
  useEffect(() => save('tts-model', modelId), [modelId]);
  useEffect(() => save('tts-voices', voiceByModel), [voiceByModel]);
  useEffect(() => save('tts-prefs', prefs), [prefs]);
  useEffect(() => {
    const id = setTimeout(() => save('tts-text', text), 400);
    return () => clearTimeout(id);
  }, [text]);

  const voice = voices.find((v) => v.voice_id === voiceId);
  const modelInfo = models.find((m) => m.model_id === modelId) ?? null;
  const schema = useMemo(() => settingsFor(modelInfo ?? (models.length ? null : { model_id: modelId, name: modelId })), [modelInfo, models.length, modelId]);
  const values = useMemo(() => resolveSettings(schema, prefs.values[modelId]), [schema, prefs.values, modelId]);
  const multilingual = isMultilingual(modelInfo) || (!models.length && modelId === DEFAULT_MODEL);
  const modelOptions: Model[] = models.length ? models : [{ model_id: DEFAULT_MODEL, name: 'OmniVoice' }];

  const setPref = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));
  const setValue = (key: string, v: number) =>
    setPrefs((p) => ({ ...p, values: { ...p.values, [modelId]: { ...values, [key]: v } } }));

  const chooseVoice = (id: string, v: Voice) => {
    const m = voiceModel(v);
    setVoiceId(id);
    setModelId(m);
    setVoiceByModel((x) => ({ ...x, [m]: id }));
  };
  const chooseModel = (m: string) => {
    if (m === modelId) return;
    setModelId(m);
    if (!voice || voiceModel(voice) !== m) setVoiceId(firstVoiceOf(m));
  };

  const tooLong = text.length > MAX;
  const voiceMatches = !!voice && voiceModel(voice) === modelId;
  const canGenerate = !!text.trim() && voiceMatches && !tooLong && !loading && !streamingId;

  // Streaming: the Generate button stops spinning as soon as the first audio actually plays.
  useEffect(() => {
    if (loading && streamingId && player.isCurrent(streamingId) && player.playing && !player.loading) setLoading(false);
  }, [loading, streamingId, player]);

  // Stop any completion polling when leaving the page.
  useEffect(() => () => void (pollRef.current.cancelled = true), []);

  const generate = useCallback(async () => {
    if (!text.trim() || !voiceId || !voiceMatches || text.length > MAX || loading || streamingId) return;
    setLoading(true);
    const body: TtsBody = {
      text,
      model_id: modelId,
      language_code: multilingual ? prefs.language || null : null,
      voice_settings: values,
      output_format: prefs.format,
    };
    const title = voice?.name ?? 'Text to Speech';
    const base = `nolabs-${slug(voice?.name ?? 'tts', 16)}-${slug(text, 28)}`;
    const report = (e: unknown) => {
      if (e instanceof ApiError && e.code === 'server_busy') toast.info('Server busy', errorMessage(e));
      else toast.error('Generation failed', errorMessage(e));
    };

    // Streams are MP3; WAV output (or STREAMING = false) uses the classic request/response path.
    if (STREAMING && !prefs.format.startsWith('wav')) {
      let session: StreamSession | null = null;
      try {
        session = await api.ttsStreamSession(voiceId, body);
      } catch (e) {
        // Older servers without stream-session: fall back to the non-streaming endpoint.
        const unsupported = e instanceof ApiError && (e.status === 405 || (e.status === 404 && e.code !== 'voice_not_found'));
        if (!unsupported) {
          report(e);
          setLoading(false);
          return;
        }
      }
      if (session) {
        startStream(session, { title, subtitle: text.slice(0, 120), seed: voiceId, filename: `${base}.mp3` });
        return;
      }
    }

    try {
      const res = await api.tts(voiceId, body);
      const ext = prefs.format.startsWith('wav') ? 'wav' : 'mp3';
      const track: Track = {
        id: res.historyItemId ?? `tts-${Date.now()}`,
        src: res.objectUrl,
        title,
        subtitle: text.slice(0, 120),
        seed: voiceId,
        filename: `${base}.${ext}`,
      };
      setLast(track);
      player.play(track);
      bumpHistory();
    } catch (e) {
      report(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, voiceId, voiceMatches, modelId, multilingual, prefs, values, loading, streamingId, voice, player, bumpHistory, toast]);

  /** Plays a stream URL right away, then polls history until the finished file exists. */
  const startStream = (session: StreamSession, meta: Pick<Track, 'title' | 'subtitle' | 'seed' | 'filename'>) => {
    const id = session.history_item_id;
    pollRef.current.cancelled = true; // stop polling for any previous generation
    const poll = { cancelled: false };
    pollRef.current = poll;
    const finish = () => {
      poll.cancelled = true;
      setStreamingId((cur) => (cur === id ? null : cur));
      setLoading(false);
    };
    const track: Track = {
      id,
      src: session.stream_url,
      streaming: true,
      ...meta,
      onError: () => {
        if (poll.cancelled) return;
        finish();
        player.close();
        toast.error('Generation failed', 'The audio stream could not be played. Check the server logs, then try again.');
      },
    };
    setLast(null);
    setStreamingId(id);
    player.play(track);

    (async () => {
      const deadline = Date.now() + STREAM_TIMEOUT_MS;
      while (!poll.cancelled && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (poll.cancelled) return;
        let item: HistoryItem;
        try {
          item = await api.historyItem(id);
        } catch (e) {
          if (e instanceof ApiError && e.status === 410) {
            // the stream stopped partway (server error or connection lost): stop waiting
            if (!poll.cancelled) {
              finish();
              toast.error('Generation stopped', 'The audio stopped before it finished. Please try again.');
            }
            return;
          }
          continue; // 404 until the stream finishes (transient errors: keep trying)
        }
        if (poll.cancelled) return;
        const finalSrc = item.audio_url || session.audio_url;
        const patch: Partial<Track> = {
          streaming: false,
          finalSrc,
          downloadUrl: finalSrc,
          duration: item.duration_secs ?? undefined,
        };
        player.updateTrack(id, patch);
        setLast({ ...track, ...patch, src: finalSrc, onError: undefined });
        bumpHistory();
        finish();
        return;
      }
      if (!poll.cancelled) {
        finish();
        toast.info('Still generating', 'This is taking longer than expected. It will appear in History when it finishes.');
      }
    })();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        generate();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [generate]);

  return (
    <div className="lg:h-full flex flex-col lg:flex-row lg:min-h-0">
      {/* Editor */}
      <section className="flex-1 min-w-0 flex flex-col min-h-[420px] lg:min-h-0" aria-label="Text editor">
        <div className="relative flex-1 min-h-0 flex flex-col">
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
            aria-label="Text to convert to speech"
            className="flex-1 w-full resize-none bg-transparent px-4 sm:px-8 pt-6 pb-4 text-[16px] leading-[1.7] placeholder:text-faint focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
            spellCheck
          />
          {!text && (
            <div className="px-4 sm:px-8 pb-6">
              <p className="text-xs text-sub mb-2.5">Get started with</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    className="chip"
                    onClick={() => {
                      setText(ex.text);
                      textRef.current?.focus();
                    }}
                  >
                    <ex.icon size={14} className="text-sub" />
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-4 sm:px-8 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 min-w-0 mr-auto">
            <span className={cx('text-xs tabular-nums', tooLong ? 'text-red-500 font-medium' : 'text-sub')} aria-live="polite">
              {text.length.toLocaleString()} / {MAX.toLocaleString()}
            </span>
            {text && (
              <button className="btn-ghost btn-sm h-7 px-2" onClick={() => setText('')} aria-label="Clear text">
                <X size={13} /> Clear
              </button>
            )}
          </div>
          {streamingId && !loading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-sub" role="status" data-testid="streaming-status">
              <span className="h-1.5 w-1.5 rounded-full bg-fg animate-pulse" aria-hidden="true" />
              Streaming…
            </span>
          )}
          {last && !loading && !streamingId && (
            <button
              className="icon-btn h-10 w-10 rounded-full border border-line"
              aria-label="Download last generation"
              onClick={() => downloadUrl(last.downloadUrl ?? last.src, last.filename ?? 'speech')}
            >
              <Download size={16} />
            </button>
          )}
          <GenerateButton loading={loading} disabled={!canGenerate} onClick={generate} shortcut loadingLabel="Generating">
            Generate speech
          </GenerateButton>
        </div>
      </section>

      {/* Right panel */}
      <aside className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col min-h-0 bg-bg" aria-label="Settings and history">
        <div className="shrink-0 flex items-center gap-1 px-3 border-b border-line" role="tablist">
          {(['settings', 'history'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={cx('tab capitalize', tab === t && 'tab-active')}
              onClick={() => setTab(t)}
            >
              {t === 'settings' ? 'Settings' : 'History'}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin" role="tabpanel">
          {tab === 'settings' ? (
            <div className="p-4 sm:p-5 flex flex-col gap-5">
              <VoicePicker value={voiceId} onChange={chooseVoice} modelId={modelId} align="right" />

              <ModelPicker models={modelOptions} value={modelId} onChange={chooseModel} align="right" />
              {modelInfo?.status === 'unavailable' && (
                <p className="-mt-3 text-2xs text-red-600 dark:text-red-400">This model failed to load on the server. Generation may not work.</p>
              )}

              <ModelSettings schema={schema} values={values} onChange={setValue} />

              {multilingual && (
                <div>
                  <label htmlFor="tts-lang" className="label">
                    Language
                  </label>
                  <select id="tts-lang" className="select h-10" value={prefs.language} onChange={(e) => setPref('language', e.target.value)}>
                    <option value="">Auto-detect</option>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <span className="label" id="fmt-label">
                  Output format
                </span>
                <div className="seg w-full" role="radiogroup" aria-labelledby="fmt-label">
                  {(
                    [
                      ['mp3_44100_128', 'MP3'],
                      ['wav_24000', 'WAV'],
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      role="radio"
                      aria-checked={prefs.format === v}
                      className={cx('seg-item flex-1', prefs.format === v && 'seg-item-active')}
                      onClick={() => setPref('format', v)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="text-xs text-sub hover:text-fg underline-offset-2 hover:underline"
                  onClick={() => setPrefs((p) => ({ ...p, language: '', values: { ...p.values, [modelId]: defaultSettings(schema) } }))}
                >
                  Reset values
                </button>
              </div>

              <p className="text-2xs text-faint leading-relaxed">
                Tip: press <span className="font-medium text-sub">{isMac ? '⌘' : 'Ctrl'} + Enter</span> to generate.{' '}
                {modelInfo?.speed === 'slow' || (!modelInfo && modelId === DEFAULT_MODEL)
                  ? 'Running on CPU, a paragraph can take 30 seconds or more.'
                  : 'This model runs about real time or faster on CPU.'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              <HistoryList
                items={history.items}
                loading={history.loading}
                compact
                onDeleted={(id) => history.setItems((xs) => xs.filter((x) => x.history_item_id !== id))}
                emptyIcon={<HistoryIcon size={18} />}
                emptyTitle="No history yet"
                emptyDescription="Your generated speech will appear here."
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
