import clsx from 'clsx';
import { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  /** Stretch segments to fill the container equally. */
  fullWidth?: boolean;
  'aria-label'?: string;
  className?: string;
}

// One unified pill track with a sliding-feel active thumb - used for every
// "pick one of a few" control (period ranges, list/sheet, chart type, goal
// type) so they all look and behave the same instead of each screen rolling
// its own row of loose buttons.
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth,
  className,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-xl p-1',
        'bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08]',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-lg font-medium transition-all duration-150 cursor-pointer whitespace-nowrap',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              fullWidth && 'flex-1',
              active
                ? 'bg-primary-600 text-white shadow-sm dark:bg-sky-400/15 dark:text-sky-100 dark:ring-1 dark:ring-inset dark:ring-sky-300/25'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/[0.06]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
