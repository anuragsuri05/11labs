import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PageShell, Section } from '../components/PageShell';
import { Slider } from '../components/Slider';
import { GenerateButton } from '../components/GenerateButton';
import { HistoryList } from '../components/HistoryList';
import { useData } from '../context/DataContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage } from '../lib/api';
import { useHistory } from '../lib/hooks';
import { cx, slug } from '../lib/utils';

const EXAMPLES = [
  'Glass shattering on concrete',
  'Thunder rumbling in the distance',
  'Footsteps on gravel, then a door creaks open',
  'Cinematic whoosh transition',
  'Crowd cheering in a stadium',
  'Old car engine starting',
  'Light rain on a tin roof',
  'Retro video game coin pickup',
];

const MAX = 450;

export default function SoundEffectsPage() {
  const { bumpHistory } = useData();
  const player = usePlayer();
  const toast = useToast();
  const history = useHistory('sfx');
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(5);
  const [influence, setInfluence] = useState(0.3);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.soundEffect(text.trim(), duration, influence);
      player.play({
        id: res.historyItemId ?? `sfx-${Date.now()}`,
        src: res.objectUrl,
        title: 'Sound effect',
        subtitle: text.trim(),
        seed: text,
        filename: `nolabs-sfx-${slug(text, 32)}.${res.contentType.includes('wav') ? 'wav' : 'mp3'}`,
      });
      bumpHistory();
    } catch (e) {
      toast.error('Sound generation failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Sound Effects" description="Describe a sound and generate it from text.">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
          <div className="p-4 sm:p-5 flex flex-col">
            <label htmlFor="sfx-prompt" className="sr-only">
              Describe a sound
            </label>
            <textarea
              id="sfx-prompt"
              value={text}
              maxLength={MAX}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && generate()}
              placeholder="Describe a sound… e.g. “A spaceship door hissing open”"
              className="w-full min-h-[140px] flex-1 resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-faint focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLES.map((ex) => (
                <button key={ex} className={cx('chip h-7 text-xs', text === ex && 'chip-active')} onClick={() => setText(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-line bg-surface/60 flex flex-col gap-5">
            <Slider label="Duration" min={1} max={10} step={0.5} value={duration} onChange={setDuration} format={(v) => `${v}s`} left="1s" right="10s" />
            <Slider
              label="Prompt influence"
              min={0}
              max={1}
              step={0.05}
              value={influence}
              onChange={setInfluence}
              format={(v) => `${Math.round(v * 100)}%`}
              left="More creative"
              right="Follow prompt"
            />
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-2xs text-faint tabular-nums">
                {text.length} / {MAX}
              </span>
              <GenerateButton loading={loading} disabled={!text.trim()} onClick={generate}>
                <Sparkles size={15} /> Generate
              </GenerateButton>
            </div>
          </div>
        </div>
      </div>
      <Section title="Generated sounds">
        <HistoryList
          items={history.items}
          loading={history.loading}
          onDeleted={(id) => history.setItems((xs) => xs.filter((x) => x.history_item_id !== id))}
          emptyIcon={<Sparkles size={18} />}
          emptyTitle="No sound effects yet"
          emptyDescription="Try one of the examples above to get started."
        />
      </Section>
    </PageShell>
  );
}
