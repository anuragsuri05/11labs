import { useRef, useState, type ReactNode } from 'react';
import { FileAudio, Upload, X } from 'lucide-react';
import { cx, formatBytes } from '../lib/utils';

interface Props {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title?: string;
  hint?: string;
  compact?: boolean;
  children?: ReactNode;
}

export function Dropzone({ accept = 'audio/*', multiple, onFiles, title = 'Click to upload, or drag and drop', hint, compact, children }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cx(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed cursor-pointer transition-colors',
        compact ? 'py-6 px-4' : 'py-10 px-4',
        over ? 'border-fg bg-muted' : 'border-line bg-surface hover:bg-muted/70',
      )}
    >
      <div className="h-10 w-10 rounded-full bg-bg border border-line flex items-center justify-center mb-2.5 text-sub">
        <Upload size={17} />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-sub mt-1">{hint}</p>}
      {children}
      <input
        ref={input}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function FileChip({ name, size, onRemove, extra }: { name: string; size?: number; onRemove?: () => void; extra?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-3 py-2 min-w-0">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sub shrink-0">
        <FileAudio size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        {size !== undefined && <p className="text-2xs text-sub">{formatBytes(size)}</p>}
      </div>
      {extra}
      {onRemove && (
        <button className="icon-btn h-7 w-7" onClick={onRemove} aria-label={`Remove ${name}`}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
