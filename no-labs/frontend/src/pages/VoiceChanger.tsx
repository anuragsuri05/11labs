import { useEffect, useMemo, useState } from 'react';
import { Mic2 } from 'lucide-react';
import { PageShell, Section } from '../components/PageShell';
import { SourceAudio, type SourceFile } from '../components/SourceAudio';
import { VoicePicker } from '../components/VoicePicker';
import { ModelSettings } from '../components/ModelSettings';
import { GenerateButton } from '../components/GenerateButton';
import { HistoryList } from '../components/HistoryList';
import { useData } from '../context/DataContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { api, errorMessage, type VoiceSettings } from '../lib/api';
import { useHistory } from '../lib/hooks';
import { load, loadValue, save } from '../lib/storage';
import { resolveSettings, settingsFor, voiceModel } from '../lib/models';
import { slug } from '../lib/utils';

export default function VoiceChangerPage() {
  const { voices, models, bumpHistory } = useData();
  const player = usePlayer();
  const toast = useToast();
  const history = useHistory('voice_changer');
  const [source, setSource] = useState<SourceFile | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(() => loadValue('vc-voice'));
  const [stored, setStored] = useState<Record<string, VoiceSettings>>(() => load('vc-settings', {} as Record<string, VoiceSettings>));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (voices.length && (!voiceId || !voices.some((v) => v.voice_id === voiceId))) setVoiceId(voices[0].voice_id);
  }, [voices, voiceId]);
  useEffect(() => {
    if (voiceId) save('vc-voice', voiceId);
  }, [voiceId]);

  const voice = voices.find((v) => v.voice_id === voiceId);
  // Settings follow the target voice's model (each model has its own schema).
  const modelId = voiceModel(voice);
  const schema = useMemo(() => settingsFor(models.find((m) => m.model_id === modelId) ?? null), [models, modelId]);
  const values = useMemo(() => resolveSettings(schema, stored[modelId]), [schema, stored, modelId]);
  useEffect(() => save('vc-settings', stored), [stored]);

  const generate = async () => {
    if (!source || !voiceId) return;
    setLoading(true);
    try {
      const res = await api.speechToSpeech(voiceId, source.blob, values);
      player.play({
        id: res.historyItemId ?? `vc-${Date.now()}`,
        src: res.objectUrl,
        title: voice?.name ?? 'Voice Changer',
        subtitle: `Converted from ${source.name}`,
        seed: voiceId,
        filename: `nolabs-voice-changer-${slug(voice?.name ?? 'voice', 20)}.${res.contentType.includes('wav') ? 'wav' : 'mp3'}`,
      });
      bumpHistory();
    } catch (e) {
      toast.error('Voice conversion failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Voice Changer" description="Transform any recording into a different voice while keeping the words and timing.">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="card p-4 sm:p-5">
          <p className="label">Source audio</p>
          <SourceAudio value={source} onChange={setSource} hint="Upload a file, or record yourself speaking" />
        </div>
        <div className="card p-4 sm:p-5 flex flex-col gap-5">
          <VoicePicker value={voiceId} onChange={setVoiceId} label="Target voice" align="right" />
          <ModelSettings
            schema={schema}
            values={values}
            onChange={(k, v) => setStored((s) => ({ ...s, [modelId]: { ...values, [k]: v } }))}
          />
          <GenerateButton loading={loading} disabled={!source || !voiceId} onClick={generate} className="w-full" loadingLabel="Converting">
            Generate speech
          </GenerateButton>
        </div>
      </div>
      <Section title="Results">
        <HistoryList
          items={history.items}
          loading={history.loading}
          onDeleted={(id) => history.setItems((xs) => xs.filter((x) => x.history_item_id !== id))}
          emptyIcon={<Mic2 size={18} />}
          emptyTitle="No conversions yet"
          emptyDescription="Converted audio will appear here."
        />
      </Section>
    </PageShell>
  );
}
