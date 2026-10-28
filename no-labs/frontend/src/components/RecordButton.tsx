import { Mic, Square } from 'lucide-react';
import { useRecorder } from '../lib/hooks';
import { cx, formatTime } from '../lib/utils';
import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

/** Button that records from the microphone and returns a Blob. */
export function RecordButton({
  onRecorded,
  label = 'Record audio',
  className,
  onStateChange,
  maxSeconds = 120,
}: {
  onRecorded: (blob: Blob) => void;
  label?: string;
  className?: string;
  onStateChange?: (recording: boolean) => void;
  maxSeconds?: number;
}) {
  const rec = useRecorder();
  const toast = useToast();

  useEffect(() => {
    if (rec.error) toast.error('Recording failed', rec.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.error]);

  useEffect(() => onStateChange?.(rec.recording), [rec.recording, onStateChange]);

  const stop = async () => {
    const blob = await rec.stop();
    if (blob && blob.size > 0) onRecorded(blob);
  };

  useEffect(() => {
    if (rec.recording && rec.elapsed >= maxSeconds) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.elapsed, rec.recording, maxSeconds]);

  if (rec.recording) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          stop();
        }}
        className={cx('btn h-9 px-4 bg-red-500 text-white hover:bg-red-600', className)}
        aria-label="Stop recording"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />
          <Square size={10} fill="currentColor" className="relative" />
        </span>
        <span className="tabular-nums">{formatTime(rec.elapsed)}</span>
        <span className="flex items-end gap-[2px] h-3.5 ml-0.5" aria-hidden="true">
          {[0.5, 1, 0.7, 0.9].map((m, i) => (
            <span key={i} className="w-[2px] rounded bg-white/90 transition-all" style={{ height: `${Math.max(15, rec.level * 100 * m)}%` }} />
          ))}
        </span>
        <span className="ml-0.5">Stop</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        rec.start();
      }}
      className={cx('btn-outline', className)}
    >
      <Mic size={15} />
      {label}
    </button>
  );
}
