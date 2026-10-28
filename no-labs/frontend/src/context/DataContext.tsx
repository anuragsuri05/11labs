import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Health, type Model, type Voice } from '../lib/api';

interface DataCtx {
  voices: Voice[];
  voicesLoading: boolean;
  voicesError: string | null;
  refreshVoices: () => Promise<void>;
  models: Model[];
  health: Health | null;
  healthOk: boolean | null;
  /** Bumped whenever a generation creates/deletes history so lists can refetch. */
  historyVersion: number;
  bumpHistory: () => void;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const refreshVoices = useCallback(async () => {
    try {
      const v = await api.voices();
      setVoices(v);
      setVoicesError(null);
    } catch (e) {
      setVoicesError(e instanceof Error ? e.message : String(e));
    } finally {
      setVoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVoices();
    api.models().then(setModels).catch(() => setModels([]));
  }, [refreshVoices]);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const check = async () => {
      let busy = false;
      try {
        const h = await api.health();
        if (!alive) return;
        setHealth(h);
        setHealthOk(h.status === 'ok');
        busy = !!h.queue && (h.queue.running > 0 || h.queue.waiting > 0);
      } catch {
        if (!alive) return;
        setHealth(null);
        setHealthOk(false);
      }
      // Poll faster while jobs are running so the queue indicator stays current.
      timer = window.setTimeout(check, busy ? 4000 : 15000);
    };
    check();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  return (
    <Ctx.Provider
      value={{ voices, voicesLoading, voicesError, refreshVoices, models, health, healthOk, historyVersion, bumpHistory }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useData outside DataProvider');
  return c;
}
