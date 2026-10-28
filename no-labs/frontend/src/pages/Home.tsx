import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AudioLines, FileText, History as HistoryIcon, Mic2, Music, Sparkles, Users, Wand2 } from 'lucide-react';
import { useHistory } from '../lib/hooks';
import { useData } from '../context/DataContext';
import { HistoryList } from '../components/HistoryList';
import { Orb } from '../components/Orb';
import { PlayButton } from '../components/PlayButton';
import { voiceTrack } from '../components/tracks';

const TOOLS = [
  { to: '/text-to-speech', title: 'Text to Speech', desc: 'Turn text into lifelike speech', icon: AudioLines, tone: 'from-violet-200 to-fuchsia-100 dark:from-violet-500/25 dark:to-fuchsia-500/10' },
  { to: '/voices', title: 'Voice Design & Clone', desc: 'Create or clone a custom voice', icon: Users, tone: 'from-sky-200 to-cyan-100 dark:from-sky-500/25 dark:to-cyan-500/10' },
  { to: '/voice-changer', title: 'Voice Changer', desc: 'Speak in any voice', icon: Mic2, tone: 'from-amber-200 to-orange-100 dark:from-amber-500/25 dark:to-orange-500/10' },
  { to: '/sound-effects', title: 'Sound Effects', desc: 'Generate sounds from text', icon: Sparkles, tone: 'from-emerald-200 to-teal-100 dark:from-emerald-500/25 dark:to-teal-500/10' },
  { to: '/music', title: 'Music', desc: 'Compose short instrumentals', icon: Music, tone: 'from-rose-200 to-pink-100 dark:from-rose-500/25 dark:to-pink-500/10' },
  { to: '/speech-to-text', title: 'Speech to Text', desc: 'Transcribe audio & video', icon: FileText, tone: 'from-indigo-200 to-blue-100 dark:from-indigo-500/25 dark:to-blue-500/10' },
  { to: '/voice-isolator', title: 'Voice Isolator', desc: 'Remove background noise', icon: Wand2, tone: 'from-lime-200 to-green-100 dark:from-lime-500/25 dark:to-green-500/10' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function HomePage() {
  const history = useHistory(undefined, 8);
  const { voices } = useData();
  const navigate = useNavigate();
  const featured = voices.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <p className="text-sm text-sub">NO LABS workspace</p>
      <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-tight mt-0.5">{greeting()}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-xl border border-line bg-bg overflow-hidden hover:shadow-card hover:border-faint/50 transition-all"
          >
            <div className={`h-20 sm:h-24 bg-gradient-to-br ${t.tone} flex items-center justify-center`}>
              <span className="h-10 w-10 rounded-full bg-bg/90 shadow-card flex items-center justify-center group-hover:scale-105 transition-transform">
                <t.icon size={18} />
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold truncate">{t.title}</p>
              <p className="text-2xs sm:text-xs text-sub truncate">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] mt-10">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Recent generations</h3>
            <Link to="/history" className="text-xs text-sub hover:text-fg inline-flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="rounded-xl border border-line p-1.5">
            <HistoryList
              items={history.items}
              loading={history.loading}
              showKind
              onDeleted={(id) => history.setItems((xs) => xs.filter((x) => x.history_item_id !== id))}
              emptyIcon={<HistoryIcon size={18} />}
              emptyTitle="Nothing here yet"
              emptyDescription="Your recent generations from every tool will show up here."
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Voices</h3>
            <Link to="/voices" className="text-xs text-sub hover:text-fg inline-flex items-center gap-1">
              Explore <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="rounded-xl border border-line p-1.5 flex flex-col gap-0.5">
            {featured.length === 0 && <li className="text-sm text-sub p-3">No voices available.</li>}
            {featured.map((v) => (
              <li key={v.voice_id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface">
                <Orb seed={v.voice_id} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{v.name}</p>
                  <p className="text-2xs text-sub truncate">{v.description || v.category}</p>
                </div>
                <PlayButton track={voiceTrack(v)} size="sm" label={`${v.name} preview`} />
                <button
                  className="btn-outline btn-sm h-7"
                  onClick={() => navigate(`/text-to-speech?voice_id=${encodeURIComponent(v.voice_id)}`)}
                  aria-label={`Use ${v.name}`}
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
