import type { Model, ModelSetting, Voice, VoiceSettings } from './api';
import { LANGUAGES } from './utils';

export const DEFAULT_MODEL = 'omnivoice';

/** Model a voice belongs to. v1 servers don't send `model_id`, and all their voices were OmniVoice. */
export function voiceModel(v: Pick<Voice, 'model_id'> | null | undefined): string {
  return v?.model_id || DEFAULT_MODEL;
}

/** True when the model accepts any language (OmniVoice), so the UI offers a language select. */
export function isMultilingual(m: Model | null | undefined): boolean {
  if (!m) return false;
  return m.model_id === 'omnivoice' || !!m.languages?.some((l) => l.language_id === 'multi');
}

export function languageCountLabel(m: Model): string | null {
  if (isMultilingual(m)) return '600+ languages';
  const n = m.languages?.length ?? 0;
  if (!n) return null;
  return n === 1 ? m.languages![0].name : `${n} languages`;
}

export type BadgeTone = 'green' | 'blue' | 'violet' | 'neutral' | 'red';
export interface Badge {
  label: string;
  tone: BadgeTone;
}

export function modelBadges(m: Model): Badge[] {
  const out: Badge[] = [];
  if (m.speed === 'fastest') out.push({ label: 'Fastest', tone: 'green' });
  else if (m.speed === 'fast') out.push({ label: 'Fast', tone: 'green' });
  else if (m.speed === 'slow') out.push({ label: 'Highest quality', tone: 'violet' });
  if (m.can_clone) out.push({ label: 'Voice cloning', tone: 'blue' });
  if (m.can_design) out.push({ label: 'Voice design', tone: 'blue' });
  const langs = languageCountLabel(m);
  if (langs) out.push({ label: langs, tone: 'neutral' });
  if (m.status === 'unavailable') out.push({ label: 'Unavailable', tone: 'red' });
  return out;
}

export const BADGE_CLASS: Record<BadgeTone, string> = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  neutral: 'bg-muted text-sub',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

/** Short display name for a model id, using the server list when it's loaded. */
export function modelName(id: string | null | undefined, models: Model[]): string {
  if (!id) return '';
  return models.find((m) => m.model_id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/* ---------- Settings ---------- */

/** Fallback when the server predates the `settings` schema (v1: OmniVoice only). */
const LEGACY_SETTINGS: ModelSetting[] = [
  { key: 'speed', label: 'Speed', min: 0.7, max: 1.3, step: 0.05, default: 1, left: 'Slower', right: 'Faster' },
  {
    key: 'quality',
    label: 'Quality',
    min: 8,
    max: 32,
    step: 1,
    default: 16,
    left: 'Faster',
    right: 'Better',
    hint: 'More diffusion steps sound better but take longer.',
  },
];

export function settingsFor(m: Model | null | undefined): ModelSetting[] {
  if (m?.settings) return m.settings;
  return !m || m.model_id === DEFAULT_MODEL ? LEGACY_SETTINGS : [];
}

export function defaultSettings(schema: ModelSetting[]): VoiceSettings {
  return Object.fromEntries(schema.map((s) => [s.key, s.default]));
}

/** Stored values merged over defaults, clamped to the current schema (drops unknown keys). */
export function resolveSettings(schema: ModelSetting[], stored: VoiceSettings | undefined): VoiceSettings {
  const out: VoiceSettings = {};
  for (const s of schema) {
    const v = stored?.[s.key];
    out[s.key] = typeof v === 'number' && isFinite(v) ? Math.min(s.max, Math.max(s.min, v)) : s.default;
  }
  return out;
}

export function formatSetting(s: ModelSetting, v: number): string {
  const decimals = s.step < 1 ? Math.min(3, (String(s.step).split('.')[1] ?? '').length) : 0;
  const n = v.toFixed(decimals);
  if (s.key === 'speed') return `${n}x`;
  if (s.key === 'quality' || s.key === 'steps') return `${n} steps`;
  return n;
}

/* ---------- Languages ---------- */

let displayNames: { of(code: string): string | undefined } | null | undefined;

export function languageLabel(code: string | null | undefined, models: Model[] = []): string {
  if (!code) return '';
  if (code === 'multi') return 'Multilingual';
  for (const m of models) {
    const hit = m.languages?.find((l) => l.language_id === code);
    if (hit?.name && hit.name.toLowerCase() !== code.toLowerCase()) return hit.name;
  }
  const known = LANGUAGES.find((l) => l.code === code);
  if (known) return known.name;
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    } catch {
      displayNames = null;
    }
  }
  try {
    return displayNames?.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** "English · American" style line for a voice (language + accent, without repeating). */
export function voiceLocale(v: Voice, models: Model[] = []): string {
  const lang = languageLabel(v.language, models);
  const accent = v.accent || v.labels?.accent || '';
  const parts = [lang, accent && accent.toLowerCase() !== lang.toLowerCase() ? capitalize(accent) : ''].filter(Boolean);
  return parts.join(' · ');
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : s;
}
