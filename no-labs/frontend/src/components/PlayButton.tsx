import { Pause, Play } from 'lucide-react';
import { usePlayer, type Track } from '../context/PlayerContext';
import { cx } from '../lib/utils';
import { Spinner } from './Spinner';

interface Props {
  track: Track | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost' | 'outline';
  className?: string;
  label?: string;
}

export function PlayButton({ track, size = 'md', variant = 'ghost', className, label }: Props) {
  const p = usePlayer();
  const current = !!track && p.isCurrent(track.id);
  const playing = current && p.playing;
  const loading = current && p.loading && p.playing;
  const dim = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-8 w-8';
  const icon = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
  return (
    <button
      type="button"
      disabled={!track}
      aria-label={`${playing ? 'Pause' : 'Play'}${label ? ` ${label}` : ''}`}
      aria-pressed={playing}
      onClick={(e) => {
        e.stopPropagation();
        if (track) p.toggle(track);
      }}
      className={cx(
        'inline-flex items-center justify-center rounded-full shrink-0 transition-colors disabled:opacity-40',
        dim,
        variant === 'solid' && 'bg-inv text-invfg hover:bg-inv/85',
        variant === 'ghost' && 'text-fg hover:bg-muted',
        variant === 'outline' && 'border border-line bg-bg text-fg hover:bg-muted',
        className,
      )}
    >
      {loading ? (
        <Spinner size={icon} />
      ) : playing ? (
        <Pause size={icon} fill="currentColor" strokeWidth={0} />
      ) : (
        <Play size={icon} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />
      )}
    </button>
  );
}
