import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cx } from '../lib/utils';

type ToastType = 'error' | 'success' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastCtx {
  toast: (t: Omit<Toast, 'id'>) => void;
  error: (title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), t.type === 'error' ? 8000 : 4000);
    },
    [dismiss],
  );

  const value: ToastCtx = {
    toast,
    error: (title, message) => toast({ type: 'error', title, message }),
    success: (title, message) => toast({ type: 'success', title, message }),
    info: (title, message) => toast({ type: 'info', title, message }),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col items-end gap-2 pointer-events-none"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = t.type === 'error' ? AlertCircle : t.type === 'success' ? CheckCircle2 : Info;
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto w-full sm:w-[360px] animate-pop-in rounded-xl border border-line bg-bg shadow-pop p-3 pr-2 flex gap-2.5"
            >
              <Icon
                size={18}
                className={cx(
                  'mt-0.5 shrink-0',
                  t.type === 'error' ? 'text-red-500' : t.type === 'success' ? 'text-emerald-500' : 'text-sub',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.message && <p className="text-xs text-sub mt-0.5 break-words">{t.message}</p>}
              </div>
              <button className="icon-btn h-6 w-6" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast outside ToastProvider');
  return c;
}
