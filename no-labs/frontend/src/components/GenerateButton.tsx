import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { useElapsed } from '../lib/hooks';
import { cx } from '../lib/utils';

interface Props {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  loadingLabel?: string;
  shortcut?: boolean;
  className?: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function GenerateButton({ loading, disabled, onClick, children, loadingLabel = 'Generating', shortcut, className }: Props) {
  const secs = useElapsed(loading);
  return (
    <button
      type="button"
      className={cx('btn-primary h-10 px-5 text-sm', className)}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Spinner size={15} />
          <span>{loadingLabel}…</span>
          <span className="tabular-nums opacity-70">{secs}s</span>
        </>
      ) : (
        <>
          {children}
          {shortcut && (
            <span className="hidden sm:inline-flex items-center gap-0.5 ml-1">
              <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span>
              <span className="kbd">↵</span>
            </span>
          )}
        </>
      )}
    </button>
  );
}
