import clsx from 'clsx';
import { EIconName } from '../../common/icon-name.enum';
import { formatMoney } from '../../utils';
import { TONE_CLASSES, getBudgetTone } from '../../utils/goalStatus';
import IconSelector from '../IconSelector';
import { ProgressBar } from '../ui';

export interface CategoryBreakdownRowProps {
  name: string;
  iconName: EIconName;
  /** Category identity color (utils/categoryColor.ts) - matches its donut slice. */
  color: string;
  amount: number;
  total: number;
  currency?: string;
  /** Active goal on this category: a spending limit (expense) or saving target (income). */
  limit?: { target: number; periodLabel: string; kind: 'limit' | 'target' } | null;
  onClick?: () => void;
}

// One category in the breakdown list. The bar answers a different question
// depending on whether a budget exists: with a limit it's "how much of my
// limit is used" (colored green/amber/rose by proximity); without one it's
// simply this category's share of the total, in its own identity color.
const CategoryBreakdownRow = ({
  name,
  iconName,
  color,
  amount,
  total,
  currency,
  limit,
  onClick,
}: CategoryBreakdownRowProps) => {
  const share = total > 0 ? (amount / total) * 100 : 0;
  const limitPercent = limit && limit.target > 0 ? (amount / limit.target) * 100 : null;
  const tone = limitPercent !== null ? getBudgetTone(limitPercent) : null;
  // For an income *target*, more is better - never paint it as a warning.
  const barTone = limit?.kind === 'target' ? 'success' : tone;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        'flex items-start gap-3 rounded-xl px-2 py-2.5 -mx-2',
        onClick &&
          'cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      )}
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg text-white"
        style={{ backgroundColor: color }}
      >
        <IconSelector name={iconName} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>
          <span className="shrink-0 font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatMoney(amount, currency)}
          </span>
        </div>

        <ProgressBar
          className="mt-1.5"
          size="sm"
          percent={limitPercent ?? share}
          color={barTone ? undefined : color}
          barClassName={barTone ? TONE_CLASSES[barTone].bar : undefined}
          label={`${name} ${limitPercent !== null ? 'of limit' : 'share of total'}`}
        />

        <div className="mt-1 flex justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{share.toFixed(1)}% of total</span>
          {limit && limitPercent !== null && (
            <span className={clsx('font-semibold', barTone && TONE_CLASSES[barTone].text)}>
              {Math.round(limitPercent)}% of {formatMoney(limit.target, currency)} {limit.periodLabel}{' '}
              {limit.kind}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdownRow;
