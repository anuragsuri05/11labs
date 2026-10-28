import { Download, Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { cx, downloadUrl, formatTime } from '../lib/utils';
import { Orb } from './Orb';
import { Spinner } from './Spinner';

const RATES = [0.75, 1, 1.25, 1.5, 2];

export function PlayerBar() {
  const p = usePlayer();
  if (!p.track) return null;
  const t = p.track;
  // Live stream: total length unknown, can't seek or download until the finished file exists.
  const live = !!t.streaming && !t.finalSrc;
  const pct = p.duration ? (p.currentTime / p.duration) * 100 : 0;
  const nextRate = () => {
    const i = RATES.indexOf(p.rate);
    p.setRate(RATES[(i + 1) % RATES.length]);
  };

  return (
    <div className="shrink-0 border-t border-line bg-bg/95 backdrop-blur animate-slide-up" role="region" aria-label="Audio player">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0 w-[34%] sm:w-[26%] shrink-0">
          <Orb seed={t.seed ?? t.id} size={34} animate={p.playing} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{t.title}</p>
            {t.subtitle && <p className="text-2xs text-sub truncate">{t.subtitle}</p>}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <button className="icon-btn hidden sm:inline-flex" aria-label="Back 5 seconds" disabled={live} onClick={() => p.seek(p.currentTime - 5)}>
              <RotateCcw size={15} />
            </button>
            <button
              className="h-9 w-9 rounded-full bg-inv text-invfg flex items-center justify-center hover:bg-inv/85 transition-colors"
              aria-label={p.playing ? 'Pause' : 'Play'}
              onClick={() => p.toggle()}
            >
              {p.loading && p.playing ? (
                <Spinner size={15} />
              ) : p.playing ? (
                <Pause size={15} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={15} fill="currentColor" strokeWidth={0} className="translate-x-[1px]" />
              )}
            </button>
            <button className="icon-btn hidden sm:inline-flex" aria-label="Forward 5 seconds" disabled={live} onClick={() => p.seek(p.currentTime + 5)}>
              <RotateCw size={15} />
            </button>
          </div>
          <div className="w-full max-w-xl flex items-center gap-2 text-2xs text-sub tabular-nums">
            <span className="w-9 text-right">{formatTime(p.currentTime)}</span>
            {live ? (
              <>
                <div
                  className="relative flex-1 h-1 rounded-full bg-line overflow-hidden"
                  role="progressbar"
                  aria-label="Generating audio"
                  aria-busy="true"
                  data-testid="stream-progress"
                >
                  <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-fg animate-indeterminate" />
                </div>
                <span className="shrink-0 text-sub">Generating…</span>
              </>
            ) : (
              <input
                type="range"
                className="range flex-1"
                min={0}
                max={p.duration || 0}
                step={0.01}
                value={Math.min(p.currentTime, p.duration || 0)}
                onChange={(e) => p.seek(Number(e.target.value))}
                style={{ ['--pct' as string]: `${pct}%` }}
                aria-label="Seek"
                aria-valuetext={`${formatTime(p.currentTime)} of ${formatTime(p.duration)}`}
              />
            )}
            {!live && <span className="w-9">{formatTime(p.duration)}</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-0.5 shrink-0 sm:w-[26%]">
          <button
            className={cx('h-8 px-2 rounded-lg text-xs font-medium tabular-nums hover:bg-muted', p.rate !== 1 ? 'text-fg' : 'text-sub')}
            onClick={nextRate}
            aria-label={`Playback speed ${p.rate}x`}
          >
            {p.rate}x
          </button>
          <button
            className="icon-btn hidden sm:inline-flex"
            aria-label="Download audio"
            disabled={live}
            title={live ? 'Available when generation finishes' : undefined}
            onClick={() => downloadUrl(t.downloadUrl ?? t.src, t.filename ?? 'nolabs-audio')}
          >
            <Download size={16} />
          </button>
          <button className="icon-btn" aria-label="Close player" onClick={p.close}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
