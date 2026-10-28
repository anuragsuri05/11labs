import type { CSSProperties } from 'react';

// Brand artwork is a white-on-transparent PNG used as a CSS mask, so it takes the
// current text colour and works in both light and dark themes.
function masked(src: string, width: number, height: number): CSSProperties {
  const mask = `url(${src}) center / contain no-repeat`;
  return { width, height, background: 'currentColor', WebkitMask: mask, mask, flexShrink: 0 };
}

const ICON_RATIO = 173 / 200;
const WORDMARK_RATIO = 1473 / 251;

export function LogoMark({ size = 24 }: { size?: number }) {
  return <span aria-hidden="true" className="inline-block" style={masked('/brand/icon.png', size * ICON_RATIO, size)} />;
}

export function Wordmark({ height = 19 }: { height?: number }) {
  return (
    <span className="inline-flex items-center" role="img" aria-label="NO LABS">
      <span className="inline-block" style={masked('/brand/wordmark.png', height * WORDMARK_RATIO, height)} />
    </span>
  );
}
