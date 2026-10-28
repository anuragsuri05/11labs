import { useEffect, useRef, useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { LogoMark } from './Logo';
import { api, ApiError, errorMessage, setUnauthorizedHandler } from '../lib/api';

/**
 * Global "Enter access key" prompt. Mounted once; the API client calls it when a request
 * gets 401 `unauthorized`, and retries the request once the session cookie is set.
 */
export function AuthGate() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(
      () =>
        new Promise<boolean>((resolve) => {
          resolver.current = resolve;
          setError(null);
          setOpen(true);
        }),
    );
    return () => setUnauthorizedHandler(null);
  }, []);

  const finish = (ok: boolean) => {
    setOpen(false);
    setKey('');
    resolver.current?.(ok);
    resolver.current = null;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.login(key.trim());
      finish(true);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'That access key is not correct.' : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => finish(false)}
      size="sm"
      title="Enter access key"
      description="This NO LABS server is protected. Enter the access key set by its owner (NOLABS_API_KEY)."
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex items-center justify-center py-2 text-fg">
          <LogoMark size={30} />
        </div>
        <div className="relative">
          <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            data-autofocus
            type="password"
            autoComplete="current-password"
            className="input h-10 pl-9"
            placeholder="Access key"
            aria-label="Access key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary h-10" disabled={!key.trim() || busy}>
          {busy && <Spinner size={14} />} Continue
        </button>
      </form>
    </Modal>
  );
}
