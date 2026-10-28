import { useId } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  left?: string;
  right?: string;
  format?: (v: number) => string;
  hint?: string;
}

export function Slider({ label, value, min, max, step, onChange, left, right, format, hint }: Props) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-xs tabular-nums text-sub">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
        aria-valuetext={format ? format(value) : String(value)}
      />
      {(left || right) && (
        <div className="flex justify-between text-2xs text-faint mt-1">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
      {hint && <p className="text-2xs text-faint mt-1">{hint}</p>}
    </div>
  );
}
