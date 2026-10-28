import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { streamingSrc } from '../lib/mseStream';

export interface Track {
  /** Stable id used to tell whether this track is the one currently loaded. */
  id: string;
  src: string;
  title: string;
  subtitle?: string;
  /** URL used for the download button (defaults to src). */
  downloadUrl?: string;
  filename?: string;
  seed?: string;
  /** True while `src` is a live, one-time stream URL that is still being generated. */
  streaming?: boolean;
  /**
   * Static file with the same audio (has Content-Length, so it can seek). When set and `src` is a stream,
   * replaying or seeking switches to it without interrupting playback that is in progress.
   */
  finalSrc?: string;
  /** Known total length in seconds (streams report Infinity/NaN until they end). */
  duration?: number;
  /** Called when the audio element fails to load/play this track (e.g. the stream failed). */
  onError?: () => void;
}

interface PlayerState {
  track: Track | null;
  playing: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  rate: number;
}

interface PlayerCtx extends PlayerState {
  play: (track: Track, startAt?: number) => void;
  toggle: (track?: Track) => void;
  pause: () => void;
  seek: (t: number) => void;
  setRate: (r: number) => void;
  close: () => void;
  /** Patch the current track in place (e.g. mark a stream as finished) without touching playback. */
  updateTrack: (id: string, patch: Partial<Track>) => void;
  isCurrent: (id: string) => boolean;
  isPlaying: (id: string) => boolean;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    track: null,
    playing: false,
    loading: false,
    currentTime: 0,
    duration: 0,
    rate: 1,
  });
  const trackRef = useRef<Track | null>(null);

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }

  useEffect(() => {
    const a = audioRef.current!;
    const upd = (patch: Partial<PlayerState>) => setState((s) => ({ ...s, ...patch }));
    const onTime = () => upd({ currentTime: a.currentTime });
    const onDur = () => upd({ duration: isFinite(a.duration) ? a.duration : 0 });
    const onPlay = () => upd({ playing: true });
    const onPause = () => upd({ playing: false });
    const onWaiting = () => upd({ loading: true });
    const onReady = () => upd({ loading: false });
    const onEnded = () => upd({ playing: false, currentTime: a.duration || 0 });
    const onError = () => {
      upd({ playing: false, loading: false });
      // Ignore errors from a detached/empty element (close()) — only report the track that was loading.
      const t = trackRef.current;
      if (t && a.getAttribute('src') === t.src) t.onError?.();
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('durationchange', onDur);
    a.addEventListener('loadedmetadata', onDur);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('canplay', onReady);
    a.addEventListener('playing', onReady);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('durationchange', onDur);
      a.removeEventListener('loadedmetadata', onDur);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('canplay', onReady);
      a.removeEventListener('playing', onReady);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      a.pause();
    };
  }, []);

  /**
   * When the current track was streamed and its finished file is now known, load that file instead
   * (needed to replay or seek: stream URLs are one-time and not seekable). Returns true if it switched.
   */
  const switchToFinal = useCallback((startAt: number, resume: boolean): boolean => {
    const a = audioRef.current!;
    const t = trackRef.current;
    if (!t?.finalSrc || a.getAttribute('src') === t.finalSrc) return false;
    const next = { ...t, src: t.finalSrc, streaming: false, onError: undefined };
    trackRef.current = next;
    a.src = t.finalSrc;
    a.playbackRate = a.defaultPlaybackRate;
    setState((s) => ({ ...s, track: next, currentTime: startAt, loading: resume }));
    a.addEventListener(
      'loadedmetadata',
      () => {
        try {
          a.currentTime = startAt;
        } catch {
          /* not seekable */
        }
      },
      { once: true },
    );
    if (resume) a.play().catch(() => setState((s) => ({ ...s, playing: false, loading: false })));
    return true;
  }, []);

  const play = useCallback((track: Track, startAt?: number) => {
    const a = audioRef.current!;
    const cur = trackRef.current;
    if (cur?.id === track.id && cur.finalSrc && track.src === a.getAttribute('src') && (a.ended || startAt !== undefined)) {
      if (switchToFinal(a.ended ? startAt ?? 0 : startAt ?? a.currentTime, true)) return;
    }
    const same = cur?.id === track.id && cur?.src === track.src;
    if (!same) {
      trackRef.current = track;
      // Live streams go through Media Source Extensions so playback starts with the first frames.
      a.src = track.streaming ? streamingSrc(track.src) : track.src;
      a.playbackRate = a.defaultPlaybackRate;
      setState((s) => ({ ...s, track, currentTime: 0, duration: 0, loading: true }));
    }
    if (startAt !== undefined) {
      const setT = () => {
        try {
          a.currentTime = startAt;
        } catch {
          /* not seekable yet */
        }
      };
      if (a.readyState >= 1) setT();
      else a.addEventListener('loadedmetadata', setT, { once: true });
    } else if (same && a.ended) {
      a.currentTime = 0;
    }
    a.play().catch(() => setState((s) => ({ ...s, playing: false, loading: false })));
  }, [switchToFinal]);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(
    (track?: Track) => {
      const a = audioRef.current!;
      if (track && trackRef.current?.id !== track.id) return play(track);
      const cur = trackRef.current;
      if (!cur) return;
      if (a.paused) {
        if (switchToFinal(a.ended ? 0 : a.currentTime, true)) return;
        // A finished one-time stream can't be fetched again; wait for the final file.
        if (cur.streaming && a.ended) return;
        if (a.ended) a.currentTime = 0;
        a.play().catch(() => undefined);
      } else a.pause();
    },
    [play, switchToFinal],
  );

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current!;
      if (!isFinite(t)) return;
      const cur = trackRef.current;
      if (cur?.streaming && !cur.finalSrc) return; // live streams can't seek
      const max = isFinite(a.duration) ? a.duration : cur?.duration ?? t;
      const target = Math.max(0, Math.min(t, max));
      if (switchToFinal(target, !a.paused)) return;
      a.currentTime = target;
      setState((s) => ({ ...s, currentTime: a.currentTime }));
    },
    [switchToFinal],
  );

  const updateTrack = useCallback((id: string, patch: Partial<Track>) => {
    const cur = trackRef.current;
    if (!cur || cur.id !== id) return;
    // `src` stays as-is so in-progress playback isn't interrupted; switchToFinal swaps it later.
    const next = { ...cur, ...patch, src: cur.src };
    trackRef.current = next;
    setState((s) => ({ ...s, track: next }));
  }, []);

  const setRate = useCallback((r: number) => {
    audioRef.current!.defaultPlaybackRate = r;
    audioRef.current!.playbackRate = r;
    setState((s) => ({ ...s, rate: r }));
  }, []);

  const close = useCallback(() => {
    const a = audioRef.current!;
    a.pause();
    a.removeAttribute('src');
    a.load();
    trackRef.current = null;
    setState((s) => ({ ...s, track: null, playing: false, currentTime: 0, duration: 0 }));
  }, []);

  const value = useMemo<PlayerCtx>(
    () => ({
      ...state,
      duration: state.duration || state.track?.duration || 0,
      play,
      toggle,
      pause,
      seek,
      setRate,
      close,
      updateTrack,
      isCurrent: (id) => state.track?.id === id,
      isPlaying: (id) => state.track?.id === id && state.playing,
    }),
    [state, play, toggle, pause, seek, setRate, close, updateTrack],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlayer outside PlayerProvider');
  return c;
}
