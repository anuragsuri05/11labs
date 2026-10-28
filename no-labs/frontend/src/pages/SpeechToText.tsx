import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, FileText, Languages, Trash2 } from 'lucide-react';
import { PageShell, Section } from '../components/PageShell';
import { SourceAudio, type SourceFile } from '../components/SourceAudio';
import { GenerateButton } from '../components/GenerateButton';
import { PlayButton } from '../components/PlayButton';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { useData } from '../context/DataContext';
import { usePlayer, type Track } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage, type HistoryItem, type SttModel, type SttResult } from '../lib/api';
import { useHistory } from '../lib/hooks';
import { loadValue, save } from '../lib/storage';
import { cx, downloadText, formatDate, formatTime, LANGUAGES, languageName, slug, toSrt } from '../lib/utils';

/** Used only if the server can't list its models (older versions). */
const FALLBACK_MODELS: SttModel[] = [
  { model_id: 'whisper-base', name: 'Whisper Base', description: 'Fastest' },
  { model_id: 'whisper-small', name: 'Whisper Small', description: 'Balanced', default: true },
  { model_id: 'whisper-medium', name: 'Whisper Medium', description: 'Most accurate' },
];

interface Loaded {
  name: string;
  result: SttResult;
  sourceUrl: string | null;
}

export default function SpeechToTextPage() {
  const { bumpHistory } = useData();
  const player = usePlayer();
  const toast = useToast();
  const history = useHistory('stt', 20);
  const [source, setSource] = useState<SourceFile | null>(null);
  const [language, setLanguage] = useState('');
  const [models, setModels] = useState<SttModel[]>([]);
  const [model, setModel] = useState(() => loadValue('stt-model') ?? '');

  useEffect(() => {
    let alive = true;
    api
      .sttModels()
      .then((list) => alive && setModels(list.length ? list : FALLBACK_MODELS))
      .catch(() => alive && setModels(FALLBACK_MODELS));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!models.length || models.some((m) => m.model_id === model)) return;
    setModel((models.find((m) => m.default) ?? models[0]).model_id);
  }, [models, model]);
  useEffect(() => {
    if (model) save('stt-model', model);
  }, [model]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [copied, setCopied] = useState(false);

  const transcribe = async () => {
    if (!source || loading) return;
    setLoading(true);
    try {
      const result = await api.stt({ file: source.blob, language_code: language || undefined, model_id: model || undefined, timestamps_granularity: 'word' });
      setLoaded({ name: source.name, result, sourceUrl: URL.createObjectURL(source.blob) });
      bumpHistory();
    } catch (e) {
      toast.error('Transcription failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const openHistory = (h: HistoryItem) => {
    setLoaded({
      name: h.text?.slice(0, 40) || 'Transcript',
      result: { text: h.text ?? '', duration: h.duration_secs, segments: [], language_code: (h.settings?.language_code as string) ?? null },
      sourceUrl: h.source_url ?? h.audio_url ?? null,
    });
  };

  const segments = useMemo(() => {
    const r = loaded?.result;
    if (!r) return [];
    if (r.segments?.length) return r.segments;
    return r.text ? [{ start: 0, end: r.duration ?? 0, text: r.text }] : [];
  }, [loaded]);

  const sourceTrack: Track | null = loaded?.sourceUrl
    ? { id: `stt-src:${loaded.sourceUrl}`, src: loaded.sourceUrl, title: loaded.name, subtitle: 'Transcription source', seed: loaded.name }
    : null;
  const activeIdx =
    sourceTrack && player.isCurrent(sourceTrack.id)
      ? segments.findIndex((s) => player.currentTime >= s.start && player.currentTime < s.end)
      : -1;

  const base = `nolabs-transcript-${slug(loaded?.name.replace(/\.[^.]+$/, '') ?? 'audio', 30)}`;
  const copy = async () => {
    if (!loaded) return;
    try {
      await navigator.clipboard.writeText(loaded.result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <PageShell title="Speech to Text" description="Transcribe audio and video files with timestamps, then export as text or subtitles.">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card p-4 sm:p-5">
          <p className="label">Audio or video file</p>
          <SourceAudio
            value={source}
            onChange={setSource}
            accept="audio/*,video/*"
            hint="MP3, WAV, M4A, WEBM, MP4, MOV… up to 200 MB"
          />
        </div>
        <div className="card p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <label htmlFor="stt-lang" className="label">
              Primary language
            </label>
            <select id="stt-lang" className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Auto-detect</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stt-model" className="label">
              Model
            </label>
            <select id="stt-model" className="select" value={model} onChange={(e) => setModel(e.target.value)} disabled={!models.length}>
              {!models.length && <option value="">Loading models…</option>}
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.name}
                </option>
              ))}
            </select>
            {models.find((m) => m.model_id === model)?.description && (
              <p className="text-2xs text-sub mt-1.5">{models.find((m) => m.model_id === model)?.description}</p>
            )}
          </div>
          <GenerateButton loading={loading} disabled={!source} onClick={transcribe} className="w-full mt-auto" loadingLabel="Transcribing">
            Transcribe
          </GenerateButton>
        </div>
      </div>

      {loaded && (
        <section className="card mt-6 overflow-hidden animate-fade-in" aria-label="Transcript">
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-b border-line">
            {sourceTrack && <PlayButton track={sourceTrack} variant="solid" label="source audio" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{loaded.name}</p>
              <p className="text-2xs text-sub flex items-center gap-1.5">
                <Languages size={12} />
                {languageName(loaded.result.language_code)}
                {loaded.result.language_probability != null && ` (${Math.round(loaded.result.language_probability * 100)}%)`}
                {loaded.result.duration ? ` · ${formatTime(loaded.result.duration)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button className="btn-ghost btn-sm" onClick={copy} aria-label="Copy transcript">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <div className="flex items-center rounded-full bg-muted p-0.5">
                <Download size={13} className="mx-2 text-sub" aria-hidden="true" />
                {(['txt', 'srt', 'json'] as const).map((f) => (
                  <button
                    key={f}
                    className="h-7 px-2.5 rounded-full text-xs font-medium text-sub hover:bg-bg hover:text-fg uppercase"
                    aria-label={`Export as ${f.toUpperCase()}`}
                    onClick={() => {
                      if (f === 'txt') downloadText(loaded.result.text, `${base}.txt`);
                      else if (f === 'srt') downloadText(toSrt(segments), `${base}.srt`, 'application/x-subrip');
                      else downloadText(JSON.stringify(loaded.result, null, 2), `${base}.json`, 'application/json');
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto p-2 sm:p-3 scrollbar-thin">
            {segments.length === 0 ? (
              <p className="text-sm text-sub p-3">No speech detected.</p>
            ) : (
              segments.map((s, i) => (
                <button
                  key={i}
                  className={cx(
                    'w-full text-left flex gap-3 sm:gap-4 rounded-lg px-2.5 py-2 transition-colors',
                    i === activeIdx ? 'bg-muted' : 'hover:bg-surface',
                  )}
                  onClick={() => sourceTrack && player.play(sourceTrack, s.start)}
                  disabled={!sourceTrack}
                  aria-label={`Play from ${formatTime(s.start)}`}
                >
                  <span className="text-2xs tabular-nums text-faint pt-[3px] w-10 shrink-0">{formatTime(s.start)}</span>
                  <span className="text-[15px] leading-relaxed">{s.text.trim()}</span>
                </button>
              ))
            )}
          </div>
        </section>
      )}

      <Section title="Recent transcripts">
        {history.loading && !history.items.length ? (
          <div className="flex justify-center py-8 text-sub">
            <Spinner />
          </div>
        ) : history.items.length === 0 ? (
          <EmptyState icon={<FileText size={18} />} title="No transcripts yet" description="Upload a file above to get started." />
        ) : (
          <ul className="flex flex-col gap-1">
            {history.items.map((h) => (
              <li key={h.history_item_id} className="group flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-surface">
                <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sub shrink-0">
                  <FileText size={15} />
                </span>
                <button className="min-w-0 flex-1 text-left" onClick={() => openHistory(h)}>
                  <p className="text-sm truncate">{h.text || 'Empty transcript'}</p>
                  <p className="text-2xs text-sub">
                    {[h.duration_secs ? formatTime(h.duration_secs) : null, formatDate(h.created_at)].filter(Boolean).join(' · ')}
                  </p>
                </button>
                <button
                  className="icon-btn h-7 w-7 hover:text-red-600"
                  aria-label="Delete transcript"
                  onClick={async () => {
                    try {
                      await api.deleteHistory(h.history_item_id);
                      history.setItems((xs) => xs.filter((x) => x.history_item_id !== h.history_item_id));
                    } catch (e) {
                      toast.error('Could not delete', errorMessage(e));
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageShell>
  );
}
