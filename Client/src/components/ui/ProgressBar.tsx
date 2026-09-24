import clsx from 'clsx';

export interface ProgressBarProps {
  /** 0-100; clamped. */
  percent: number;
  /** Tailwind bg class for the fill, or a raw CSS color via `color`. */
  barClassName?: string;
  /** Overrides the default neutral track (e.g. a translucent white track on a colored card). */
  trackClassName?: string;
  color?: string;
  /** Optional "where you should be by now" tick, 0-100 (budget pacing). */
  markerPercent?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  label?: string;
}

const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' };

const ProgressBar = ({
  percent,
  barClassName = 'bg-primary-500',
  trackClassName = 'bg-zinc-200 dark:bg-white/10',
  color,
  markerPercent,
  size = 'sm',
  className,
  label,
}: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
      className={clsx(
        'relative w-full rounded-full overflow-hidden',
        trackClassName,
        heights[size],
        className,
      )}
    >
      <div
        className={clsx('h-full rounded-full transition-[width] duration-500', !color && barClassName)}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
      {markerPercent !== undefined && (
        <span
          aria-hidden
          className="absolute top-0 h-full w-0.5 bg-zinc-900/60 dark:bg-white/70"
          style={{ left: `${Math.max(0, Math.min(100, markerPercent))}%` }}
        />
      )}
    </div>
  );
};

export default ProgressBar;
