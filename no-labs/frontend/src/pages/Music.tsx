import { useState } from 'react';
import { Music as MusicIcon, Plus } from 'lucide-react';
import { PageShell, Section } from '../components/PageShell';
import { Slider } from '../components/Slider';
import { GenerateButton } from '../components/GenerateButton';
import { HistoryList } from '../components/HistoryList';
import { useData } from '../context/DataContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage } from '../lib/api';
import { useHistory } from '../lib/hooks';
import { slug } from '../lib/utils';

const GENRES = ['lofi hip hop', 'cinematic orchestral', 'synthwave', 'acoustic folk', 'jazz', 'house', 'ambient', 'rock', 'piano ballad', 'drum and bass'];
const MOODS = ['mellow', 'upbeat', 'epic', 'dark', 'dreamy', 'energetic', 'melancholic', 'happy'];
const INSTRUMENTS = ['piano', 'acoustic guitar', 'strings', 'analog synths', '808 drums', 'saxophone'];

export default function MusicPage() {
  const { bumpHistory } = useData();
  const player = usePlayer();
  const toast = useToast();
  const history = useHistory('music');
  const [prompt, setPrompt] = useState('');
  const [length, setLength] = useState(15);
  const [loading, setLoading] = useState(false);

  const append = (term: string) =>
    setPrompt((p) => {
      const parts = p.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.includes(term)) return p;
      return [...parts, term].join(', ');
    });

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.music(prompt.trim(), length * 1000);
      player.play({
        id: res.historyItemId ?? `music-${Date.now()}`,
        src: res.objectUrl,
        title: 'Music',
        subtitle: prompt.trim(),
        seed: prompt,
        filename: `nolabs-music-${slug(prompt, 32)}.${res.contentType.includes('wav') ? 'wav' : 'mp3'}`,
      });
      bumpHistory();
    } catch (e) {
      toast.error('Music generation failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const ChipRow = ({ title, items }: { title: string; items: string[] }) => (
    <div>
      <p className="text-2xs font-medium uppercase tracking-wider text-faint mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((g) => (
          <button key={g} className="chip h-7 text-xs gap-1" onClick={() => append(g)} aria-label={`Add ${g}`}>
            <Plus size={12} className="text-faint" />
            {g}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell title="Music" description="Generate short instrumental tracks from a text description.">
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5">
          <label htmlFor="music-prompt" className="sr-only">
            Describe the music
          </label>
          <textarea
            id="music-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && generate()}
            placeholder="Describe the music… e.g. “lofi hip hop beat, mellow piano, vinyl crackle, 80 bpm”"
            className="w-full min-h-[110px] resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-faint focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="flex flex-col gap-3 mt-3">
            <ChipRow title="Genre" items={GENRES} />
            <ChipRow title="Mood" items={MOODS} />
            <ChipRow title="Instruments" items={INSTRUMENTS} />
          </div>
        </div>
        <div className="border-t border-line bg-surface/60 p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 sm:max-w-xs">
            <Slider label="Length" min={5} max={30} step={1} value={length} onChange={setLength} format={(v) => `${v}s`} />
          </div>
          <div className="sm:ml-auto">
            <GenerateButton loading={loading} disabled={!prompt.trim()} onClick={generate} className="w-full sm:w-auto" loadingLabel="Composing">
              <MusicIcon size={15} /> Generate music
            </GenerateButton>
          </div>
        </div>
      </div>
      <Section title="Your tracks">
        <HistoryList
          items={history.items}
          loading={history.loading}
          onDeleted={(id) => history.setItems((xs) => xs.filter((x) => x.history_item_id !== id))}
          emptyIcon={<MusicIcon size={18} />}
          emptyTitle="No music yet"
          emptyDescription="Pick a genre and mood above, then generate."
        />
      </Section>
    </PageShell>
  );
}
