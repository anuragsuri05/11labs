import { useMemo, useState } from 'react';
import { Download, History as HistoryIcon, RefreshCw, Search, Trash2 } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { PlayButton } from '../components/PlayButton';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { KindIcon } from '../components/KindIcon';
import { historyTrack } from '../components/tracks';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage, type HistoryItem, type HistoryKind } from '../lib/api';
import { useHistory } from '../lib/hooks';
import { cx, downloadText, downloadUrl, formatDate, formatTime, KIND_LABELS, slug } from '../lib/utils';

const KINDS: ('' | HistoryKind)[] = ['', 'tts', 'voice_changer', 'sfx', 'music', 'stt', 'isolation'];

export default function HistoryPage() {
  const [kind, setKind] = useState<'' | HistoryKind>('');
  const [q, setQ] = useState('');
  const history = useHistory(kind || undefined, 200);
  const player = usePlayer();
  const toast = useToast();

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return history.items;
    return history.items.filter((h) => [h.text, h.voice_name].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [history.items, q]);

  const del = async (h: HistoryItem) => {
    try {
      await api.deleteHistory(h.history_item_id);
      if (player.isCurrent(h.history_item_id)) player.close();
      history.setItems((xs) => xs.filter((x) => x.history_item_id !== h.history_item_id));
    } catch (e) {
      toast.error('Could not delete item', errorMessage(e));
    }
  };

  return (
    <PageShell
      title="History"
      description="Everything you've generated, transcribed and converted."
      actions={
        <button className="btn-outline btn-sm self-start" onClick={() => history.reload()} aria-label="Refresh history">
          <RefreshCw size={13} /> Refresh
        </button>
      }
    >
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
        <div className="relative md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input pl-9" placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search history" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {KINDS.map((k) => (
            <button key={k || 'all'} className={cx('chip h-8', kind === k && 'chip-active')} onClick={() => setKind(k)} aria-pressed={kind === k}>
              {k ? KIND_LABELS[k] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {history.loading && !history.items.length ? (
        <div className="flex justify-center py-16 text-sub">
          <Spinner size={20} />
        </div>
      ) : history.error ? (
        <EmptyState icon={<HistoryIcon size={18} />} title="Couldn't load history" description={history.error} />
      ) : items.length === 0 ? (
        <EmptyState icon={<HistoryIcon size={18} />} title="No history yet" description="Generations from every tool will show up here." />
      ) : (
        <div className="rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-surface text-2xs uppercase tracking-wider text-faint">
              <tr>
                <th scope="col" className="w-12 py-2.5 pl-3 text-left font-medium">
                  <span className="sr-only">Type</span>
                </th>
                <th scope="col" className="py-2.5 px-2 text-left font-medium">Text</th>
                <th scope="col" className="hidden md:table-cell w-36 py-2.5 px-2 text-left font-medium">Voice</th>
                <th scope="col" className="hidden lg:table-cell w-40 py-2.5 px-2 text-left font-medium">Date</th>
                <th scope="col" className="hidden sm:table-cell w-20 py-2.5 px-2 text-left font-medium">Length</th>
                <th scope="col" className="w-[104px] py-2.5 pr-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((h) => {
                const t = historyTrack(h);
                return (
                  <tr key={h.history_item_id} className={cx('transition-colors', t && player.isCurrent(h.history_item_id) ? 'bg-muted' : 'hover:bg-surface')}>
                    <td className="py-2.5 pl-3">
                      <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sub" title={KIND_LABELS[h.kind]}>
                        <KindIcon kind={h.kind} />
                      </span>
                    </td>
                    <td className="py-2.5 px-2 min-w-0">
                      <p className="truncate">{h.text || <span className="text-faint">—</span>}</p>
                      <p className="text-2xs text-sub truncate">
                        {KIND_LABELS[h.kind]}
                        <span className="md:hidden">{h.voice_name ? ` · ${h.voice_name}` : ''}</span>
                        <span className="lg:hidden"> · {formatDate(h.created_at)}</span>
                      </p>
                    </td>
                    <td className="hidden md:table-cell py-2.5 px-2 truncate text-sub">{h.voice_name || '—'}</td>
                    <td className="hidden lg:table-cell py-2.5 px-2 text-sub">{formatDate(h.created_at)}</td>
                    <td className="hidden sm:table-cell py-2.5 px-2 text-sub tabular-nums">{h.duration_secs ? formatTime(h.duration_secs) : '—'}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {t ? <PlayButton track={t} size="sm" label={h.text?.slice(0, 30) ?? 'audio'} /> : <span className="w-7" />}
                        <button
                          className="icon-btn h-7 w-7"
                          aria-label="Download"
                          onClick={() =>
                            t ? downloadUrl(t.src, t.filename ?? 'audio') : downloadText(h.text ?? '', `nolabs-transcript-${slug(h.text ?? 'stt', 24)}.txt`)
                          }
                        >
                          <Download size={14} />
                        </button>
                        <button className="icon-btn h-7 w-7 hover:text-red-600" aria-label="Delete" onClick={() => del(h)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
