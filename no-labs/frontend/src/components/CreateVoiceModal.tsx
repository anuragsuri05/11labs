import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Copy, Mic, Sparkles, Wand2 } from 'lucide-react';
import { Modal } from './Modal';
import { Dropzone, FileChip } from './Dropzone';
import { RecordButton } from './RecordButton';
import { PlayButton } from './PlayButton';
import { Orb } from './Orb';
import { Spinner } from './Spinner';
import { api, errorMessage, extFor, type Voice, type VoicePreview } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { usePlayer } from '../context/PlayerContext';
import { useElapsed } from '../lib/hooks';
import { cx, formatTime } from '../lib/utils';

type Step = 'choose' | 'design' | 'clone';

const GENDERS = ['', 'female', 'male'];
const AGES = ['', 'child', 'teenager', 'young adult', 'middle-aged', 'elderly'];
const PITCHES = ['', 'very low pitch', 'low pitch', 'moderate pitch', 'high pitch', 'very high pitch'];
const ACCENTS = ['', 'american', 'british', 'australian', 'canadian', 'indian', 'chinese', 'japanese', 'korean', 'portuguese', 'russian'];

const DEFAULT_SAMPLE =
  'Every great story begins with a single voice. Mine might be the one you hear in your head the next time you open a book.';

const SCRIPT =
  "Hi there! I'm recording a short sample of my voice. I'm speaking clearly and naturally, at a comfortable pace, in a quiet room. The quick brown fox jumps over the lazy dog, and the sun sets slowly behind the hills.";

export function CreateVoiceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (v: Voice) => void }) {
  const [step, setStep] = useState<Step>('choose');
  useEffect(() => {
    if (open) setStep('choose');
  }, [open]);

  const title = step === 'choose' ? 'Create a voice' : step === 'design' ? 'Voice Design' : 'Instant Voice Clone';
  const description =
    step === 'choose'
      ? 'Design an entirely new voice from a description, or clone one from a short recording.'
      : step === 'design'
        ? 'Describe the voice you want and generate three previews to choose from. Designed voices use OmniVoice.'
        : 'Upload or record 10–20 seconds of clean speech to clone a voice.';

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size={step === 'choose' ? 'md' : 'lg'}>
      {step !== 'choose' && (
        <button className="btn-ghost btn-sm -ml-2 mb-3" onClick={() => setStep('choose')}>
          <ArrowLeft size={14} /> Back
        </button>
      )}
      {step === 'choose' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              k: 'design' as const,
              icon: Sparkles,
              title: 'Voice Design',
              desc: 'Describe gender, age, pitch and accent to generate a brand-new voice.',
              tone: 'from-violet-200 via-fuchsia-200 to-amber-100 dark:from-violet-500/30 dark:via-fuchsia-500/25 dark:to-amber-400/20',
            },
            {
              k: 'clone' as const,
              icon: Mic,
              title: 'Instant Voice Clone',
              desc: 'Clone a voice from a few seconds of uploaded or recorded audio.',
              tone: 'from-sky-200 via-cyan-100 to-emerald-100 dark:from-sky-500/30 dark:via-cyan-500/20 dark:to-emerald-400/20',
            },
          ].map((c) => (
            <button
              key={c.k}
              onClick={() => setStep(c.k)}
              className="group text-left rounded-xl border border-line hover:border-faint/60 hover:shadow-card transition-all overflow-hidden"
            >
              <div className={cx('h-24 bg-gradient-to-br flex items-center justify-center', c.tone)}>
                <span className="h-11 w-11 rounded-full bg-bg/90 flex items-center justify-center shadow-card">
                  <c.icon size={19} />
                </span>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-semibold flex items-center gap-1">
                  {c.title}
                  <ChevronRight size={14} className="text-faint group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-xs text-sub mt-0.5">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {step === 'design' && <DesignForm onCreated={onCreated} />}
      {step === 'clone' && <CloneForm onCreated={onCreated} />}
    </Modal>
  );
}

function Select({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} className="select capitalize" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o ? o.replace(' pitch', '') : 'Any'}
          </option>
        ))}
      </select>
    </div>
  );
}

function DesignForm({ onCreated }: { onCreated: (v: Voice) => void }) {
  const toast = useToast();
  const player = usePlayer();
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [pitch, setPitch] = useState('');
  const [accent, setAccent] = useState('');
  const [whisper, setWhisper] = useState(false);
  const [extra, setExtra] = useState('');
  const [sample, setSample] = useState(DEFAULT_SAMPLE);
  const [previews, setPreviews] = useState<VoicePreview[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const secs = useElapsed(loading);

  const description = useMemo(
    () =>
      [gender, age, pitch, accent ? `${accent} accent` : '', whisper ? 'whisper' : '', ...extra.split(',').map((s) => s.trim())]
        .filter(Boolean)
        .join(', '),
    [gender, age, pitch, accent, whisper, extra],
  );

  const generate = async () => {
    if (!description) {
      toast.info('Describe the voice first', 'Pick at least one attribute or write a description.');
      return;
    }
    setLoading(true);
    setPreviews([]);
    setSelected(null);
    try {
      const res = await api.createPreviews(description, sample.trim() || undefined);
      setPreviews(res.previews ?? []);
      if (res.previews?.[0]) {
        setSelected(res.previews[0].generated_voice_id);
      }
    } catch (e) {
      toast.error('Could not generate previews', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!selected || !name.trim()) return;
    setSaving(true);
    try {
      const v = await api.createVoiceFromPreview(selected, name.trim(), description);
      toast.success('Voice created', `${v.name} was added to My Voices.`);
      player.close();
      onCreated(v);
    } catch (e) {
      toast.error('Could not save voice', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Select id="vd-gender" label="Gender" value={gender} options={GENDERS} onChange={setGender} />
        <Select id="vd-age" label="Age" value={age} options={AGES} onChange={setAge} />
        <Select id="vd-pitch" label="Pitch" value={pitch} options={PITCHES} onChange={setPitch} />
        <Select id="vd-accent" label="Accent" value={accent} options={ACCENTS} onChange={setAccent} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer w-fit">
        <input type="checkbox" className="h-4 w-4 accent-current rounded" checked={whisper} onChange={(e) => setWhisper(e.target.checked)} />
        Whispering voice
      </label>
      <div>
        <label htmlFor="vd-extra" className="label">
          Additional description <span className="text-faint font-normal">(optional, comma-separated)</span>
        </label>
        <input id="vd-extra" className="input" placeholder="e.g. warm, calm" value={extra} onChange={(e) => setExtra(e.target.value)} />
      </div>
      <div className="rounded-lg bg-surface border border-line px-3 py-2 text-xs">
        <span className="text-sub">Voice description: </span>
        <span className="font-medium">{description || '—'}</span>
      </div>
      <div>
        <label htmlFor="vd-sample" className="label">
          Sample text
        </label>
        <textarea id="vd-sample" className="input h-auto py-2 min-h-[72px] resize-y" value={sample} onChange={(e) => setSample(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={generate} disabled={loading || !description}>
          {loading ? (
            <>
              <Spinner size={14} /> Generating previews… <span className="tabular-nums opacity-70">{secs}s</span>
            </>
          ) : (
            <>
              <Wand2 size={14} /> {previews.length ? 'Regenerate previews' : 'Generate previews'}
            </>
          )}
        </button>
      </div>

      {previews.length > 0 && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <p className="text-sm font-medium">Choose a preview</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Voice previews">
            {previews.map((p, i) => {
              const sel = selected === p.generated_voice_id;
              return (
                <div
                  key={p.generated_voice_id}
                  role="radio"
                  aria-checked={sel}
                  tabIndex={0}
                  onClick={() => setSelected(p.generated_voice_id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(p.generated_voice_id))}
                  className={cx(
                    'flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-colors',
                    sel ? 'border-fg bg-surface' : 'border-line hover:bg-surface',
                  )}
                >
                  <Orb seed={p.generated_voice_id} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Preview {i + 1}</p>
                    {p.duration_secs ? <p className="text-2xs text-sub">{formatTime(p.duration_secs)}</p> : null}
                  </div>
                  <PlayButton
                    size="sm"
                    variant="outline"
                    label={`preview ${i + 1}`}
                    track={{ id: p.generated_voice_id, src: p.audio_url, title: `Preview ${i + 1}`, subtitle: description, seed: p.generated_voice_id }}
                  />
                  {sel && <Check size={15} />}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <label htmlFor="vd-name" className="label">
                Voice name
              </label>
              <input id="vd-name" className="input" placeholder="e.g. Midnight Narrator" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <button className="btn-primary" disabled={!selected || !name.trim() || saving} onClick={save}>
              {saving ? <Spinner size={14} /> : null} Save voice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Sample {
  id: string;
  blob: Blob;
  name: string;
  recorded?: boolean;
}

function CloneForm({ onCreated }: { onCreated: (v: Voice) => void }) {
  const toast = useToast();
  const { refreshVoices, models } = useData();
  // OmniVoice always clones; other models (Pocket) only when the server reports can_clone.
  const cloneModels = useMemo(() => {
    const list = models.filter((m) => m.can_clone);
    return list.length ? list : [{ model_id: 'omnivoice', name: 'OmniVoice', description: undefined, speed: 'slow' }];
  }, [models]);
  const [modelId, setModelId] = useState('omnivoice');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [transcript, setTranscript] = useState('');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const secs = useElapsed(saving);

  useEffect(() => {
    const next: Record<string, string> = {};
    samples.forEach((s) => (next[s.id] = urls[s.id] ?? URL.createObjectURL(s.blob)));
    Object.entries(urls).forEach(([k, u]) => !next[k] && URL.revokeObjectURL(u));
    setUrls(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples]);

  const addFiles = (files: File[]) => {
    const audio = files.filter((f) => f.type.startsWith('audio/') || f.type.startsWith('video/') || /\.(wav|mp3|m4a|ogg|webm|flac|aac|mp4)$/i.test(f.name));
    if (audio.length < files.length) toast.info('Some files were skipped', 'Only audio files are supported.');
    setSamples((s) => [...s, ...audio.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, blob: f, name: f.name }))]);
  };

  useEffect(() => {
    if (!cloneModels.some((m) => m.model_id === modelId)) setModelId(cloneModels[0].model_id);
  }, [cloneModels, modelId]);

  const canSave = name.trim() && samples.length > 0 && consent && !saving && !recording;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const files = samples.map((s) => (s.blob instanceof File ? s.blob : new File([s.blob], s.name, { type: s.blob.type })));
      const res = await api.addVoice({ name: name.trim(), description: description.trim(), ref_text: transcript.trim(), model_id: modelId, files });
      await refreshVoices();
      toast.success('Voice cloned', `${res.voice?.name ?? name} was added to My Voices.`);
      onCreated(res.voice);
    } catch (e) {
      toast.error('Could not clone voice', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ivc-name" className="label">
            Name
          </label>
          <input id="ivc-name" className="input" placeholder="e.g. My narrator voice" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ivc-desc" className="label">
            Description <span className="text-faint font-normal">(optional)</span>
          </label>
          <input id="ivc-desc" className="input" placeholder="e.g. Calm, mid-30s, British" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {cloneModels.length > 1 && (
        <div>
          <span className="label" id="ivc-model-label">
            Model
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="ivc-model-label">
            {cloneModels.map((m) => {
              const sel = m.model_id === modelId;
              return (
                <button
                  key={m.model_id}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setModelId(m.model_id)}
                  className={cx(
                    'text-left rounded-xl border p-3 transition-colors min-w-0',
                    sel ? 'border-fg bg-surface' : 'border-line hover:bg-surface',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                      {m.name}
                      {m.model_id === 'omnivoice' && <span className="text-faint font-normal"> (default)</span>}
                    </span>
                    {sel && <Check size={15} className="shrink-0" />}
                  </span>
                  <span className="block text-2xs text-sub mt-0.5">
                    {m.speed === 'slow' ? 'Best likeness, 600+ languages, slower' : m.speed === 'fastest' ? 'Fastest generation, fewer languages' : m.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <span className="label">Audio samples</span>
        <Dropzone
          multiple
          compact
          accept="audio/*,video/*"
          onFiles={addFiles}
          title="Click to upload, or drag and drop"
          hint="Audio or video files · 10–20 seconds of clean speech works best"
        />
        <div className="mt-3 rounded-xl border border-line p-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div>
              <p className="text-sm font-medium">Or record your voice</p>
              <p className="text-2xs text-sub">Read the script below in a quiet room.</p>
            </div>
            <RecordButton
              label="Record"
              onStateChange={setRecording}
              onRecorded={(blob) =>
                setSamples((s) => [
                  ...s,
                  { id: `rec-${Date.now()}`, blob, name: `Recording ${s.filter((x) => x.recorded).length + 1}.${extFor(blob.type)}`, recorded: true },
                ])
              }
            />
          </div>
          <div className={cx('mt-2.5 rounded-lg px-3 py-2.5 text-sm leading-relaxed transition-colors', recording ? 'bg-red-50 dark:bg-red-500/10' : 'bg-surface')}>
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sub">"{SCRIPT}"</p>
              <button
                className="icon-btn h-7 w-7"
                aria-label="Use script as transcript"
                title="Use as transcript"
                onClick={() => setTranscript(SCRIPT)}
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>

        {samples.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {samples.map((s) => (
              <li key={s.id}>
                <FileChip
                  name={s.name}
                  size={s.blob.size}
                  onRemove={() => setSamples((xs) => xs.filter((x) => x.id !== s.id))}
                  extra={
                    urls[s.id] ? (
                      <PlayButton size="sm" label={s.name} track={{ id: `sample:${s.id}`, src: urls[s.id], title: s.name, subtitle: 'Voice sample' }} />
                    ) : null
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="ivc-transcript" className="label">
          Transcript <span className="text-faint font-normal">(optional — auto-transcribed if empty)</span>
        </label>
        <textarea
          id="ivc-transcript"
          className="input h-auto py-2 min-h-[64px] resize-y"
          placeholder="What is said in the samples"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-2.5 text-sm cursor-pointer rounded-xl border border-line p-3">
        <input type="checkbox" className="h-4 w-4 mt-0.5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I have the rights and consent to clone this voice.
          <span className="block text-2xs text-sub mt-0.5">
            Only clone your own voice or a voice you have explicit permission to use. Don't use cloned voices to deceive or impersonate.
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <button className="btn-primary" disabled={!canSave} onClick={save}>
          {saving ? (
            <>
              <Spinner size={14} /> Cloning… <span className="tabular-nums opacity-70">{secs}s</span>
            </>
          ) : (
            'Add voice'
          )}
        </button>
      </div>
    </div>
  );
}

export function EditVoiceModal({ voice, onClose, onSaved }: { voice: Voice | null; onClose: () => void; onSaved: (v: Voice) => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [labels, setLabels] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!voice) return;
    setName(voice.name);
    setDescription(voice.description ?? '');
    setLabels(
      Object.entries(voice.labels ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', '),
    );
  }, [voice]);

  const save = async () => {
    if (!voice || !name.trim()) return;
    setSaving(true);
    try {
      const parsed: Record<string, string> = {};
      labels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((pair) => {
          const [k, ...rest] = pair.split(':');
          const v = rest.join(':').trim();
          if (k.trim() && v) parsed[k.trim().toLowerCase().replace(/\s+/g, '_')] = v;
        });
      const v = await api.updateVoice(voice.voice_id, { name: name.trim(), description: description.trim(), labels: parsed });
      toast.success('Voice updated');
      onSaved(v);
    } catch (e) {
      toast.error('Could not update voice', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!voice}
      onClose={onClose}
      title="Edit voice"
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !name.trim()}>
            {saving && <Spinner size={14} />} Save changes
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="ev-name" className="label">
            Name
          </label>
          <input id="ev-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ev-desc" className="label">
            Description
          </label>
          <textarea id="ev-desc" className="input h-auto py-2 min-h-[64px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ev-labels" className="label">
            Labels
          </label>
          <input id="ev-labels" className="input" placeholder="gender: female, accent: british" value={labels} onChange={(e) => setLabels(e.target.value)} />
          <p className="text-2xs text-faint mt-1">Comma-separated key: value pairs.</p>
        </div>
      </div>
    </Modal>
  );
}
