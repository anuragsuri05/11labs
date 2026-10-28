import { Dropzone, FileChip } from './Dropzone';
import { RecordButton } from './RecordButton';
import { PlayButton } from './PlayButton';
import { useObjectUrl } from '../lib/hooks';
import { extFor } from '../lib/api';

export interface SourceFile {
  blob: Blob;
  name: string;
}

/** Upload-or-record source audio picker with inline preview. */
export function SourceAudio({
  value,
  onChange,
  accept = 'audio/*',
  hint = 'Audio files up to 200 MB',
  allowRecord = true,
  title,
}: {
  value: SourceFile | null;
  onChange: (f: SourceFile | null) => void;
  accept?: string;
  hint?: string;
  allowRecord?: boolean;
  title?: string;
}) {
  const url = useObjectUrl(value?.blob ?? null);
  if (value) {
    return (
      <FileChip
        name={value.name}
        size={value.blob.size}
        onRemove={() => onChange(null)}
        extra={url ? <PlayButton size="sm" variant="outline" label={value.name} track={{ id: `src:${url}`, src: url, title: value.name, subtitle: 'Source audio' }} /> : null}
      />
    );
  }
  return (
    <Dropzone accept={accept} onFiles={(f) => onChange({ blob: f[0], name: f[0].name })} hint={hint} title={title}>
      {allowRecord && (
        <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="h-px w-8 bg-line" />
          <span className="text-2xs text-faint uppercase tracking-wider">or</span>
          <span className="h-px w-8 bg-line" />
        </div>
      )}
      {allowRecord && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <RecordButton
            label="Record audio"
            onRecorded={(blob) => onChange({ blob, name: `Recording ${new Date().toLocaleTimeString()}.${extFor(blob.type)}` })}
          />
        </div>
      )}
    </Dropzone>
  );
}
