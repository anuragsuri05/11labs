import { useState } from 'react';
import { Download, Wand2 } from 'lucide-react';
import { PageShell, Section } from '../components/PageShell';
import { SourceAudio, type SourceFile } from '../components/SourceAudio';
import { GenerateButton } from '../components/GenerateButton';
import { PlayButton } from '../components/PlayButton';
import { HistoryList } from '../components/HistoryList';
import { useData } from '../context/DataContext';
import { usePlayer, type Track } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage } from '../lib/api';
import { useHistory } from '../lib/hooks';
import { cx, downloadUrl, formatTime, slug } from '../lib/utils';

function ABCard({ label, track, tone, onDownload }: { label: string; track: Track; tone: string; onDownload?: () => void }) {
  const p = usePlayer();
  const current = p.isCurrent(track.id);
  const pct = current && p.duration ? (p.currentTime / p.duration) * 100 : 0;
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={cx('pill', tone)}>{label}</span>
        {onDownload && (
          <button className="icon-btn h-7 w-7" onClick={onDownload} aria-label={`Download ${label}`}>
            <Download size={14} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <PlayButton track={track} variant="solid" size="lg" label={label} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          <div className="mt-2 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-fg transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-2xs text-sub tabular-nums mt-1">
            {current ? `${formatTime(p.currentTime)} / ${formatTime(p.duration)}` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VoiceIsolatorPage() {
  const { bumpHistory } = useData();
  const player = usePlayer();
  const toast = useToast();
  const history = useHistory('isolation');
  const [source, setSource] = useState<SourceFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ before: Track; after: Track } | null>(null);

  const run = async () => {
    if (!source || loading) return;
    setLoading(true);
    try {
      const res = await api.isolate(source.blob);
      const beforeUrl = URL.createObjectURL(source.blob);
      const name = source.name.replace(/\.[^.]+$/, '');
      const after: Track = {
        id: res.historyItemId ?? `iso-${Date.now()}`,
        src: res.objectUrl,
        title: `${name} (isolated)`,
        subtitle: 'Voice isolated',
        seed: source.name,
        filename: `nolabs-isolated-${slug(name, 30)}.${res.contentType.includes('wav') ? 'wav' : 'mp3'}`,
      };
      const before: Track = { id: `iso-src-${beforeUrl}`, src: beforeUrl, title: source.name, subtitle: 'Original', seed: source.name };
      setResult({ before, after });
      player.play(after);
      bumpHistory();
    } catch (e) {
      toast.error('Voice isolation failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Voice Isolator" description="Remove background noise, music and ambience to extract crystal-clear speech.">
      <div className="card p-4 sm:p-5">
        <SourceAudio value={source} onChange={setSource} accept="audio/*,video/*" hint="Audio or video files up to 200 MB" />
        <div className="flex justify-end mt-4">
          <GenerateButton loading={loading} disabled={!source} onClick={run} loadingLabel="Isolating">
            <Wand2 size={15} /> Isolate voice
          </GenerateButton>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-5 animate-fade-in">
          <ABCard label="Before" track={result.before} tone="" />
          <ABCard
            label="After"
            track={result.after}
            tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            onDownload={() => downloadUrl(result.after.src, result.after.filename ?? 'isolated')}
          />
        </div>
      )}

      <Section title="History">
        <HistoryList
          items={history.items}
          loading={history.loading}
          onDeleted={(id) => history.setItems((xs) => xs.filter((x) => x.history_item_id !== id))}
          emptyIcon={<Wand2 size={18} />}
          emptyTitle="Nothing isolated yet"
          emptyDescription="Upload a noisy recording to get started."
        />
      </Section>
    </PageShell>
  );
}
