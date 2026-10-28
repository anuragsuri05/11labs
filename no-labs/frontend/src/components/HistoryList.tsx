import { Download, Trash2 } from 'lucide-react';
import type { HistoryItem } from '../lib/api';
import { api, errorMessage } from '../lib/api';
import { cx, downloadUrl, formatDate, formatTime, KIND_LABELS } from '../lib/utils';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { PlayButton } from './PlayButton';
import { historyTrack } from './tracks';
import { Orb } from './Orb';
import { KindIcon } from './KindIcon';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import type { ReactNode } from 'react';

interface Props {
  items: HistoryItem[];
  loading?: boolean;
  onDeleted?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  showKind?: boolean;
  compact?: boolean;
}

export function HistoryList({ items, loading, onDeleted, emptyTitle = 'No generations yet', emptyDescription, emptyIcon, showKind, compact }: Props) {
  const player = usePlayer();
  const toast = useToast();
  const { bumpHistory } = useData();

  const del = async (h: HistoryItem) => {
    try {
      await api.deleteHistory(h.history_item_id);
      if (player.isCurrent(h.history_item_id)) player.close();
      onDeleted?.(h.history_item_id);
      bumpHistory();
    } catch (e) {
      toast.error('Could not delete item', errorMessage(e));
    }
  };

  if (loading && !items.length)
    return (
      <div className="flex justify-center py-10 text-sub">
        <Spinner />
      </div>
    );
  if (!items.length) return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;

  return (
    <ul className="flex flex-col gap-1">
      {items.map((h) => {
        const t = historyTrack(h);
        const current = player.isCurrent(h.history_item_id);
        return (
          <li
            key={h.history_item_id}
            className={cx(
              'group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors',
              current ? 'bg-muted' : 'hover:bg-surface',
              t && 'cursor-pointer',
            )}
            onClick={() => t && player.toggle(t)}
          >
            {showKind ? (
              <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sub shrink-0">
                <KindIcon kind={h.kind} />
              </span>
            ) : (
              <Orb seed={h.voice_id || h.history_item_id} size={compact ? 26 : 30} />
            )}
            <div className="min-w-0 flex-1">
              <p className={cx('text-sm truncate', !compact && 'font-medium')}>{h.text || KIND_LABELS[h.kind]}</p>
              <p className="text-2xs text-sub truncate">
                {[showKind ? KIND_LABELS[h.kind] : null, h.voice_name, h.duration_secs ? formatTime(h.duration_secs) : null, formatDate(h.created_at)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {t && <PlayButton track={t} size="sm" label={h.text?.slice(0, 30) ?? 'audio'} />}
              {t && (
                <button
                  className="icon-btn h-7 w-7"
                  aria-label="Download"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadUrl(t.src, t.filename ?? 'audio');
                  }}
                >
                  <Download size={14} />
                </button>
              )}
              <button
                className="icon-btn h-7 w-7 hover:text-red-600"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  del(h);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
