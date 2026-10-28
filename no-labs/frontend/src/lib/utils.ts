import type { HistoryKind, SttSegment } from './api';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function formatTime(sec: number | null | undefined): string {
  if (sec == null || !isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const ss = String(s % 60).padStart(2, '0');
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400 && d.getDate() === now.getDate()) return `${Math.floor(diff / 3600)}h ago`;
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }) +
    ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/* ---------- Deterministic gradient orbs ---------- */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function orbGradient(seed: string): string {
  const h = hash(seed || 'nolabs');
  const h1 = h % 360;
  const h2 = (h1 + 40 + ((h >> 9) % 80)) % 360;
  const h3 = (h1 + 160 + ((h >> 17) % 90)) % 360;
  const a = (h >> 5) % 360;
  const x = 20 + ((h >> 3) % 60);
  const y = 20 + ((h >> 11) % 60);
  return [
    `radial-gradient(circle at ${x}% ${y}%, hsl(${h3} 95% 82%) 0%, transparent 55%)`,
    `conic-gradient(from ${a}deg at 50% 50%, hsl(${h1} 85% 66%), hsl(${h2} 90% 72%), hsl(${h3} 85% 70%), hsl(${h1} 85% 66%))`,
  ].join(', ');
}

/* ---------- Download helpers ---------- */
export function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadText(text: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function slug(s: string, max = 40): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max) || 'audio'
  );
}

export function extFromUrl(url: string | null | undefined, fallback = 'mp3'): string {
  if (!url) return fallback;
  const m = url.split('?')[0].match(/\.([a-z0-9]{2,4})$/i);
  return m ? m[1].toLowerCase() : fallback;
}

/* ---------- Subtitles ---------- */
function srtTime(t: number): string {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`;
}

export function toSrt(segments: SttSegment[]): string {
  return segments
    .map((s, i) => `${i + 1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text.trim()}\n`)
    .join('\n');
}

/* ---------- Static data ---------- */
export const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'id', name: 'Indonesian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'cs', name: 'Czech' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
];

export function languageName(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  return LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase();
}

export const KIND_LABELS: Record<HistoryKind, string> = {
  tts: 'Text to Speech',
  stt: 'Speech to Text',
  voice_changer: 'Voice Changer',
  isolation: 'Voice Isolator',
  sfx: 'Sound Effects',
  music: 'Music',
};

export function itemFilename(kind: string, text: string | null | undefined, url: string | null | undefined): string {
  return `nolabs-${kind}-${slug(text || kind, 32)}.${extFromUrl(url)}`;
}
