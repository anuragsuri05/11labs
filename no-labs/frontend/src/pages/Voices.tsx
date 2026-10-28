import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { usePlayer } from '../context/PlayerContext';
import { api, errorMessage, type Voice } from '../lib/api';
import { cx, formatDate } from '../lib/utils';
import { capitalize, languageLabel, modelName, voiceLocale, voiceModel } from '../lib/models';
import { Orb } from '../components/Orb';
import { PlayButton } from '../components/PlayButton';
import { KebabMenu } from '../components/Menu';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { CreateVoiceModal, EditVoiceModal } from '../components/CreateVoiceModal';
import { Modal } from '../components/Modal';
import { voiceTrack } from '../components/tracks';

type Tab = 'mine' | 'explore';

const CATEGORY_LABEL: Record<string, string> = { premade: 'Default', cloned: 'Cloned', generated: 'Designed' };

const PAGE = 30;

export default function VoicesPage() {
  const { voices, voicesLoading, voicesError, refreshVoices, models } = useData();
  const toast = useToast();
  const player = usePlayer();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(() => (voices.some((v) => v.category !== 'premade') ? 'mine' : 'explore'));
  const [q, setQ] = useState('');
  const [model, setModel] = useState('all');
  const [language, setLanguage] = useState('all');
  const [gender, setGender] = useState('all');
  const [category, setCategory] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Voice | null>(null);
  const [deleting, setDeleting] = useState<Voice | null>(null);
  const [busy, setBusy] = useState(false);

  const base = useMemo(
    () => voices.filter((v) => (tab === 'mine' ? v.category !== 'premade' : v.category === 'premade')),
    [voices, tab],
  );

  // Filter options come from the voices in the current tab, so every option has results.
  const options = useMemo(() => {
    const modelIds = new Set<string>();
    const langs = new Set<string>();
    const genders = new Set<string>();
    base.forEach((v) => {
      modelIds.add(voiceModel(v));
      if (v.language) langs.add(v.language);
      if (v.labels?.gender) genders.add(v.labels.gender.toLowerCase());
    });
    const order = models.map((m) => m.model_id);
    return {
      models: Array.from(modelIds).sort((x, y) => (order.indexOf(x) + 1 || 99) - (order.indexOf(y) + 1 || 99)),
      languages: Array.from(langs)
        .map((code) => ({ code, name: languageLabel(code, models) }))
        .sort((x, y) => x.name.localeCompare(y.name)),
      genders: Array.from(genders).sort(),
    };
  }, [base, models]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return base.filter((v) => {
      if (model !== 'all' && voiceModel(v) !== model) return false;
      if (language !== 'all' && v.language !== language) return false;
      if (gender !== 'all' && (v.labels?.gender ?? '').toLowerCase() !== gender) return false;
      if (category !== 'all' && v.category !== category) return false;
      if (!s) return true;
      return [v.name, v.description, v.voice_id, v.accent, languageLabel(v.language, models), ...Object.values(v.labels ?? {})]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(s);
    });
  }, [base, q, model, language, gender, category, models]);

  useEffect(() => setShown(PAGE), [tab, q, model, language, gender, category]);

  const filtersActive = model !== 'all' || language !== 'all' || gender !== 'all' || category !== 'all';
  const resetFilters = () => {
    setModel('all');
    setLanguage('all');
    setGender('all');
    setCategory('all');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteVoice(deleting.voice_id);
      if (player.isCurrent(`voice:${deleting.voice_id}`)) player.close();
      toast.success('Voice deleted', deleting.name);
      await refreshVoices();
      setDeleting(null);
    } catch (e) {
      toast.error('Could not delete voice', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pickVoice = (v: Voice) => navigate(`/text-to-speech?voice_id=${encodeURIComponent(v.voice_id)}`);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">Voices</h2>
          <p className="text-sm text-sub mt-1">Browse default voices, design new ones, or clone your own.</p>
        </div>
        <button className="btn-primary h-10 self-start sm:self-auto" onClick={() => setCreating(true)}>
          <Plus size={16} /> Create a Voice
        </button>
      </div>

      <div className="mt-6 border-b border-line flex items-center gap-1" role="tablist">
        {(
          [
            ['mine', 'My Voices'],
            ['explore', 'Explore'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={cx('tab', tab === k && 'tab-active')}
            onClick={() => {
              setTab(k);
              resetFilters();
            }}
          >
            {l}
            <span className="ml-1.5 text-2xs text-faint tabular-nums">
              {voices.filter((v) => (k === 'mine' ? v.category !== 'premade' : v.category === 'premade')).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative md:w-72 shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9 pr-8" placeholder="Search voices…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search voices" />
            {q && (
              <button className="absolute right-1.5 top-1/2 -translate-y-1/2 icon-btn h-6 w-6" onClick={() => setQ('')} aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 min-w-0">
            <FilterSelect
              label="Language"
              value={language}
              onChange={setLanguage}
              options={options.languages.map((l) => [l.code, l.name])}
            />
            <FilterSelect label="Gender" value={gender} onChange={setGender} options={options.genders.map((g) => [g, capitalize(g)])} />
            {tab === 'mine' && (
              <FilterSelect
                label="Type"
                value={category}
                onChange={setCategory}
                options={[
                  ['cloned', 'Cloned'],
                  ['generated', 'Designed'],
                ]}
              />
            )}
            {(filtersActive || q) && (
              <button
                className="btn-ghost btn-sm"
                onClick={() => {
                  resetFilters();
                  setQ('');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {options.models.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by model">
            {['all', ...options.models].map((m) => (
              <button
                key={m}
                className={cx('chip h-8', model === m && 'chip-active')}
                onClick={() => setModel(m)}
                aria-pressed={model === m}
                data-model-filter={m}
              >
                {m === 'all' ? 'All models' : modelName(m, models)}
                <span className={cx('text-2xs tabular-nums', model === m ? 'opacity-70' : 'text-faint')}>
                  {m === 'all' ? base.length : base.filter((v) => voiceModel(v) === m).length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        {voicesLoading ? (
          <div className="flex justify-center py-16 text-sub">
            <Spinner size={20} />
          </div>
        ) : voicesError ? (
          <EmptyState
            icon={<Users size={18} />}
            title="Couldn't load voices"
            description={voicesError}
            action={
              <button className="btn-secondary" onClick={refreshVoices}>
                Try again
              </button>
            }
          />
        ) : list.length === 0 ? (
          tab === 'mine' && !q && !filtersActive ? (
            <EmptyState
              icon={<Users size={18} />}
              title="You don't have any voices yet"
              description="Design a brand-new voice from a description, or clone one from a short recording."
              action={
                <button className="btn-primary" onClick={() => setCreating(true)}>
                  <Plus size={15} /> Create a Voice
                </button>
              }
            />
          ) : (
            <EmptyState icon={<Search size={18} />} title="No voices match your search" />
          )
        ) : (
          <>
            <ul className="rounded-xl border border-line divide-y divide-line overflow-visible" data-testid="voice-list">
              {list.slice(0, shown).map((v) => (
                <VoiceRow
                  key={v.voice_id}
                  v={v}
                  modelLabel={modelName(voiceModel(v), models)}
                  locale={voiceLocale(v, models)}
                  onUse={() => pickVoice(v)}
                  onEdit={() => setEditing(v)}
                  onDelete={() => setDeleting(v)}
                />
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-sub">
              <span className="tabular-nums" data-testid="voice-count">
                Showing {Math.min(shown, list.length)} of {list.length}
              </span>
              {shown < list.length && (
                <button className="btn-outline btn-sm" onClick={() => setShown((n) => n + PAGE)}>
                  Show more
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <CreateVoiceModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={async () => {
          setCreating(false);
          setTab('mine');
          await refreshVoices();
        }}
      />
      <EditVoiceModal
        voice={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await refreshVoices();
        }}
      />
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete voice?"
        description={deleting ? `"${deleting.name}" will be permanently deleted. This can't be undone.` : ''}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete} disabled={busy}>
              {busy && <Spinner size={14} />} Delete
            </button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  if (!options.length) return null;
  return (
    <select
      className={cx('select h-8 w-auto max-w-full rounded-full text-sm', value !== 'all' && 'border-fg/50 font-medium')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Filter by ${label.toLowerCase()}`}
    >
      <option value="all">{`${label}: All`}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function VoiceRow({
  v,
  modelLabel,
  locale,
  onUse,
  onEdit,
  onDelete,
}: {
  v: Voice;
  modelLabel: string;
  locale: string;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const labels = Object.entries(v.labels ?? {}).filter(([k, val]) => val && k !== 'accent');
  return (
    <li
      data-voice-id={v.voice_id}
      data-model-id={voiceModel(v)}
      className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-surface transition-colors first:rounded-t-xl last:rounded-b-xl">
      <div className="relative shrink-0">
        <Orb seed={v.voice_id} size={40} />
        <span className="absolute inset-0 flex items-center justify-center">
          <PlayButton
            track={voiceTrack(v)}
            size="md"
            label={`${v.name} preview`}
            className="bg-black/0 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/25 aria-pressed:opacity-100 aria-pressed:bg-black/25"
          />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold truncate">{v.name}</p>
          <span
            className={cx(
              'pill shrink-0',
              v.category === 'premade' && 'hidden sm:inline-flex',
              v.category === 'cloned' && 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
              v.category === 'generated' && 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
            )}
          >
            {CATEGORY_LABEL[v.category] ?? v.category}
          </span>
          <span className="pill shrink-0 normal-case border border-line bg-bg" data-testid="model-badge">
            {modelLabel}
          </span>
        </div>
        <p className="text-xs text-sub truncate mt-0.5">
          {[locale, v.description].filter(Boolean).join(' · ')}
        </p>
        {labels.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 mt-1.5">
            {labels.slice(0, 5).map(([k, val]) => (
              <span key={k} className="pill" title={k.replace(/_/g, ' ')}>
                {String(val).replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="hidden lg:block text-2xs text-faint w-28 text-right">{v.category !== 'premade' ? formatDate(v.created_at) : ''}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button className="btn-outline btn-sm" onClick={onUse} aria-label={`Use ${v.name}`}>
          Use
        </button>
        {v.category !== 'premade' ? (
          <KebabMenu
            label={`More actions for ${v.name}`}
            items={[
              { label: 'Edit', icon: <Pencil size={14} />, onClick: onEdit },
              { label: 'Delete', icon: <Trash2 size={14} />, onClick: onDelete, danger: true },
            ]}
          />
        ) : (
          <span className="w-8" aria-hidden="true" />
        )}
      </div>
    </li>
  );
}
