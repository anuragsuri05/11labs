import { orbGradient, cx } from '../lib/utils';

export function Orb({ seed, size = 32, className, animate }: { seed: string; size?: number; className?: string; animate?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx('relative inline-block shrink-0 rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <span
        className={cx('absolute -inset-[15%] rounded-full', animate && 'animate-orb')}
        style={{ background: orbGradient(seed) }}
      />
      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),inset_0_-4px_10px_rgba(255,255,255,0.25)]" />
    </span>
  );
}
