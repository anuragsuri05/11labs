import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type HistoryItem } from './api';
import { useData } from '../context/DataContext';

/** Seconds elapsed while `running` is true (resets when it starts). */
export function useElapsed(running: boolean): number {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setSecs(0);
    const id = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, [running]);
  return secs;
}

/** History list for a kind (or all), refetched whenever history changes. */
export function useHistory(kind?: string, limit = 50) {
  const { historyVersion } = useData();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const h = await api.history({ kind, limit });
      setItems(h);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [kind, limit]);

  useEffect(() => {
    load();
  }, [load, historyVersion]);

  return { items, setItems, loading, error, reload: load };
}

/** Object URL for a File/Blob that is revoked on change/unmount. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export function useClickOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · NO LABS` : 'NO LABS';
  }, [title]);
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

/** MediaRecorder wrapper with elapsed timer. */
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const resolveRef = useRef<((b: Blob | null) => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const elapsed = useElapsed(recording);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is not supported in this browser (requires HTTPS or localhost).');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported?.(m));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const blob = chunks.current.length ? new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }) : null;
        cleanup();
        setRecording(false);
        resolveRef.current?.(blob);
        resolveRef.current = null;
      };
      rec.start(250);
      recRef.current = rec;
      setRecording(true);

      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        src.connect(an);
        const buf = new Uint8Array(an.fftSize);
        const tick = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 3));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* level meter optional */
      }
      return true;
    } catch (e) {
      cleanup();
      setError(e instanceof Error && e.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not access the microphone.');
      return false;
    }
  }, [cleanup]);

  const stop = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const rec = recRef.current;
        if (!rec || rec.state === 'inactive') return resolve(null);
        resolveRef.current = resolve;
        rec.stop();
      }),
    [],
  );

  return { recording, elapsed, start, stop, error, level };
}
