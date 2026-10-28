import { useCallback, useState } from 'react';
import { Check, ChevronDown, Cpu } from 'lucide-react';
import type { Model } from '../lib/api';
import { useClickOutside } from '../lib/hooks';
import { BADGE_CLASS, modelBadges } from '../lib/models';
import { cx } from '../lib/utils';

interface Props {
  models: Model[];
  value: string;
  onChange: (modelId: string) => void;
  label?: string;
  /** @deprecated the menu now always matches the trigger width */
  align?: 'left' | 'right';
}

function Badges({ m, max }: { m: Model; max?: number }) {
  const badges = modelBadges(m).slice(0, max);
  if (!badges.length) return null;
  return (
    <span className="flex flex-wrap gap-1 min-w-0">
      {badges.map((b) => (
        <span key={b.label} className={cx('inline-flex items-center rounded-full px-1.5 h-[18px] text-2xs font-medium whitespace-nowrap', BADGE_CLASS[b.tone])}>
          {b.label}
        </span>
      ))}
    </span>
  );
}

/** ElevenLabs-style model dropdown: each option shows its name, description and capability badges. */
export function ModelPicker({ models, value, onChange, label = 'Model' }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(open, close);
  const selected = models.find((m) => m.model_id === value) ?? null;

  return (
    <div className="relative" ref={ref}>
      <span className="label">{label}</span>
      <button
        type="button"
        className="w-full min-h-11 flex items-center gap-2.5 rounded-xl border border-line bg-bg px-2.5 py-2 text-left hover:bg-surface transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.name ?? value}`}
        data-testid="model-picker"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="h-[26px] w-[26px] rounded-lg bg-muted flex items-center justify-center text-sub shrink-0">
          <Cpu size={14} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate">{selected?.name ?? (models.length ? 'Select a model' : 'Loading models…')}</span>
          {selected && (
            <span className="block mt-0.5">
              <Badges m={selected} max={2} />
            </span>
          )}
        </span>
        <ChevronDown size={16} className={cx('text-faint transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cx(
            // match the trigger's width so the menu never spills out of (and gets clipped by) the settings panel
            'absolute z-50 mt-1.5 inset-x-0 min-w-0 rounded-xl border border-line bg-bg shadow-pop animate-pop-in overflow-hidden',
          )}
        >
          <div className="max-h-[400px] overflow-y-auto p-1 scrollbar-thin" role="listbox" aria-label="Models">
            {models.map((m) => {
              const sel = m.model_id === value;
              return (
                <button
                  key={m.model_id}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  data-model-id={m.model_id}
                  className={cx('w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left hover:bg-muted', sel && 'bg-muted')}
                  onClick={() => {
                    onChange(m.model_id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{m.name}</span>
                      {m.voice_count ? <span className="text-2xs text-faint shrink-0">{m.voice_count} voices</span> : null}
                    </span>
                    {m.description && <span className="block text-xs text-sub mt-0.5 leading-snug">{m.description}</span>}
                    <span className="block mt-1.5">
                      <Badges m={m} />
                    </span>
                  </span>
                  {sel && <Check size={15} className="shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
