import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useClickOutside } from '../lib/hooks';
import type { Voice } from '../lib/api';
import { modelName, voiceLocale, voiceModel } from '../lib/models';
import { cx } from '../lib/utils';
import { Orb } from './Orb';
import { PlayButton } from './PlayButton';
import { voiceTrack } from './tracks';
import { Spinner } from './Spinner';

interface Props {
  value: string | null;
  onChange: (voiceId: string, voice: Voice) => void;
  label?: string;
  align?: 'left' | 'right';
  /** When set, only this model's voices are shown unless the user turns on "All models". */
  modelId?: string;
}

/** Cap rendered rows so ~100 voices with play buttons stay snappy; search narrows the rest. */
const MAX_ROWS = 120;

export function VoicePicker({ value, onChange, label = 'Voice', modelId }: Props) {
  const { voices, voicesLoading, models } = useData();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [allModels, setAllModels] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(open, close);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = voices.find((v) => v.voice_id === value) ?? null;
  const scoped = !!modelId && !allModels;

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => searchRef.current?.focus(), 10);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return voices.filter((v) => {
      if (scoped && voiceModel(v) !== modelId) return false;
      if (!s) return true;
      return [v.name, v.description, v.category, v.language, v.accent, voiceModel(v), ...Object.values(v.labels ?? {})]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(s);
    });
  }, [voices, q, scoped, modelId]);

  // My voices first, then default voices grouped by model.
  const groups = useMemo(() => {
    const out: { key: string; title: string; items: Voice[] }[] = [];
    const mine = filtered.filter((v) => v.category !== 'premade');
    if (mine.length) out.push({ key: 'mine', title: 'My voices', items: mine });
    const premade = filtered.filter((v) => v.category === 'premade');
    const order = Array.from(new Set([...models.map((m) => m.model_id), ...premade.map(voiceModel)]));
    for (const id of order) {
      const items = premade.filter((v) => voiceModel(v) === id);
      if (items.length) out.push({ key: id, title: scoped ? 'Default voices' : `${modelName(id, models)} voices`, items });
    }
    let budget = MAX_ROWS;
    return out
      .map((g) => {
        const items = g.items.slice(0, Math.max(0, budget));
        budget -= items.length;
        return { ...g, items };
      })
      .filter((g) => g.items.length);
  }, [filtered, models, scoped]);

  const hidden = filtered.length - groups.reduce((n, g) => n + g.items.length, 0);
  const subline = (v: Voice) =>
    [voiceLocale(v, models), v.labels?.gender, v.labels?.age].filter(Boolean).join(' · ') || v.description || v.category;

  return (
    <div className="relative" ref={ref}>
      <span className="label">{label}</span>
      <button
        type="button"
        className="w-full h-11 flex items-center gap-2.5 rounded-xl border border-line bg-bg px-2.5 text-left hover:bg-surface transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.name ?? 'none selected'}`}
        data-testid="voice-picker"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? <Orb seed={selected.voice_id} size={26} /> : <span className="h-[26px] w-[26px] rounded-full bg-muted shrink-0" />}
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate">
            {selected?.name ?? (voicesLoading ? 'Loading voices…' : 'Select a voice')}
          </span>
          {selected && <span className="block text-2xs text-sub truncate">{voiceLocale(selected, models) || modelName(voiceModel(selected), models)}</span>}
        </span>
        <ChevronDown size={16} className={cx('text-faint transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cx(
            // match the trigger's width so the menu never spills out of (and gets clipped by) its panel
            'absolute z-50 mt-1.5 inset-x-0 min-w-0 rounded-xl border border-line bg-bg shadow-pop animate-pop-in overflow-hidden',
          )}
        >
          <div className="p-2 border-b border-line flex flex-col gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                className="input h-8 pl-8"
                placeholder="Search voices…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search voices"
                onKeyDown={(e) => {
                  const first = groups[0]?.items[0];
                  if (e.key === 'Enter' && first) {
                    onChange(first.voice_id, first);
                    setOpen(false);
                  }
                }}
              />
            </div>
            {modelId && (
              <div className="seg w-full" role="radiogroup" aria-label="Voice scope">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!allModels}
                  className={cx('seg-item flex-1 h-7 text-xs truncate', !allModels && 'seg-item-active')}
                  onClick={() => setAllModels(false)}
                >
                  {modelName(modelId, models)}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={allModels}
                  className={cx('seg-item flex-1 h-7 text-xs', allModels && 'seg-item-active')}
                  onClick={() => setAllModels(true)}
                >
                  All models
                </button>
              </div>
            )}
          </div>
          <div className="max-h-[340px] overflow-y-auto p-1 scrollbar-thin" role="listbox" aria-label="Voices">
            {voicesLoading && (
              <div className="flex justify-center py-6 text-sub">
                <Spinner />
              </div>
            )}
            {!voicesLoading && groups.length === 0 && (
              <p className="text-sm text-sub text-center py-6 px-3">
                {scoped && !q ? `No ${modelName(modelId, models)} voices yet` : 'No voices found'}
              </p>
            )}
            {groups.map((g) => (
              <div key={g.key} className="mb-1">
                <p className="px-2 pt-2 pb-1 text-2xs font-medium uppercase tracking-wider text-faint">{g.title}</p>
                {g.items.map((v) => {
                  const sel = v.voice_id === value;
                  const other = !!modelId && voiceModel(v) !== modelId;
                  return (
                    <div
                      key={v.voice_id}
                      role="option"
                      aria-selected={sel}
                      data-voice-id={v.voice_id}
                      className={cx('group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted', sel && 'bg-muted')}
                    >
                      <PlayButton track={voiceTrack(v)} size="sm" label={`${v.name} preview`} className="bg-transparent" />
                      <button
                        type="button"
                        className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
                        onClick={() => {
                          onChange(v.voice_id, v);
                          setOpen(false);
                        }}
                      >
                        <Orb seed={v.voice_id} size={24} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate">{v.name}</span>
                          <span className="block text-2xs text-sub truncate capitalize">{subline(v)}</span>
                        </span>
                        {(!scoped && g.key === 'mine') || other ? (
                          <span className="pill shrink-0 normal-case">{modelName(voiceModel(v), models)}</span>
                        ) : null}
                        {sel && <Check size={15} className="shrink-0" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
            {hidden > 0 && <p className="text-2xs text-faint text-center py-2">{hidden} more, search to narrow down</p>}
          </div>
        </div>
      )}
    </div>
  );
}
