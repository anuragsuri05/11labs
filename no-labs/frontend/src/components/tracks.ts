import type { HistoryItem, Voice } from '../lib/api';
import type { Track } from '../context/PlayerContext';
import { KIND_LABELS, itemFilename } from '../lib/utils';

export function voiceTrack(v: Voice): Track | null {
  if (!v.preview_url) return null;
  return {
    id: `voice:${v.voice_id}`,
    src: v.preview_url,
    title: v.name,
    subtitle: v.description || 'Voice preview',
    seed: v.voice_id,
    filename: `nolabs-voice-${v.name.toLowerCase().replace(/\W+/g, '-')}.${v.preview_url.split('.').pop() || 'wav'}`,
  };
}

export function historyTrack(h: HistoryItem): Track | null {
  if (!h.audio_url) return null;
  return {
    id: h.history_item_id,
    src: h.audio_url,
    title: h.voice_name || KIND_LABELS[h.kind] || 'Audio',
    subtitle: h.text || KIND_LABELS[h.kind],
    seed: h.voice_id || h.history_item_id,
    filename: itemFilename(h.kind, h.text, h.audio_url),
  };
}
