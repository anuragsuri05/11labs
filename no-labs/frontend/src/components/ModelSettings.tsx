import type { ModelSetting, VoiceSettings } from '../lib/api';
import { formatSetting } from '../lib/models';
import { Slider } from './Slider';

/** Renders a model's `settings` schema as sliders. */
export function ModelSettings({
  schema,
  values,
  onChange,
}: {
  schema: ModelSetting[];
  values: VoiceSettings;
  onChange: (key: string, value: number) => void;
}) {
  if (!schema.length) return null;
  return (
    <>
      {schema.map((s) => (
        <Slider
          key={s.key}
          label={s.label}
          min={s.min}
          max={s.max}
          step={s.step}
          value={values[s.key] ?? s.default}
          onChange={(v) => onChange(s.key, v)}
          left={s.left}
          right={s.right}
          hint={s.hint}
          format={(v) => formatSetting(s, v)}
        />
      ))}
    </>
  );
}
