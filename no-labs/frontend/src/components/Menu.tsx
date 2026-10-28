import { useCallback, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useClickOutside } from '../lib/hooks';
import { cx } from '../lib/utils';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function KebabMenu({ items, label = 'More actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(open, close);
  return (
    <div className="relative" ref={ref}>
      <button
        className="icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-40 min-w-[160px] rounded-xl border border-line bg-bg shadow-pop p-1 animate-pop-in"
        >
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onClick();
              }}
              className={cx(
                'w-full flex items-center gap-2 h-8 px-2.5 rounded-lg text-sm text-left hover:bg-muted disabled:opacity-40',
                it.danger ? 'text-red-600 dark:text-red-400' : 'text-fg',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
