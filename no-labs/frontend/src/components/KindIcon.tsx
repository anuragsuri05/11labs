import { AudioLines, FileText, Mic2, Music, Sparkles, Wand2, type LucideIcon } from 'lucide-react';
import type { HistoryKind } from '../lib/api';

export const KIND_ICONS: Record<HistoryKind, LucideIcon> = {
  tts: AudioLines,
  stt: FileText,
  voice_changer: Mic2,
  isolation: Wand2,
  sfx: Sparkles,
  music: Music,
};

export function KindIcon({ kind, size = 15 }: { kind: HistoryKind; size?: number }) {
  const Icon = KIND_ICONS[kind] ?? AudioLines;
  return <Icon size={size} />;
}
