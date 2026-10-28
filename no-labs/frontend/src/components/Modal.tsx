import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  onBack?: () => void;
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab' && panel.current) {
        const els = panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, button:not([aria-label="Close"])');
      (el ?? panel.current)?.focus();
    }, 20);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cx(
          'relative w-full bg-bg border border-line shadow-pop animate-pop-in flex flex-col',
          'rounded-t-2xl sm:rounded-2xl max-h-[92vh]',
          size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        {(title || description) && (
          <div className="flex items-start gap-3 px-5 pt-5 pb-3">
            <div className="flex-1 min-w-0">
              {title && <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>}
              {description && <p className="text-sm text-sub mt-0.5">{description}</p>}
            </div>
            <button className="icon-btn -mr-1.5 -mt-1" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-5 pb-5 overflow-y-auto scrollbar-thin">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
