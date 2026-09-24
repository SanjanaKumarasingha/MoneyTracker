import { IoWalletOutline } from 'react-icons/io5';
import { IGoalWithProgress } from '../../types';
import { TONE_CLASSES, getBudgetTone } from '../../utils/goalStatus';
import { getCategoryColor } from '../../utils/categoryColor';
import { formatMoney } from '../../utils';
import IconSelector from '../IconSelector';
import { Card } from '../ui';
import PercentRing from './PercentRing';
import { PERIOD_LABELS } from './labels';

export interface BudgetRowProps {
  goal: IGoalWithProgress;
  onClick: () => void;
}

// Spending limit ("budget"): one compact row - category chip in its identity
// color (same color it has on Charts/Records), how much of the limit is used,
// and a ring whose color says how close to the limit you are.
const BudgetRow = ({ goal, onClick }: BudgetRowProps) => {
  const { wallet, progress } = goal;
  const tone = getBudgetTone(progress.percent);
  const exceeded = progress.status === 'exceeded';
  const title = goal.name || goal.category?.name || wallet.name;

  return (
    <Card
      padding="sm"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-3 !px-4 !py-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-white"
        style={{ backgroundColor: goal.category ? getCategoryColor(goal.category.id) : '#2563eb' }}
      >
        {goal.category ? <IconSelector name={goal.category.icon} /> : <IoWalletOutline />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {formatMoney(progress.actual, wallet.currency)} of{' '}
          {formatMoney(Number(goal.targetAmount), wallet.currency)} · {wallet.name} ·{' '}
          {PERIOD_LABELS[goal.periodType]}
        </p>
        {exceeded && (
          <p className={`mt-0.5 text-xs font-semibold ${TONE_CLASSES.danger.text}`}>
            {formatMoney(Math.abs(progress.remaining), wallet.currency)} over the limit
          </p>
        )}
      </div>
      <PercentRing percent={progress.percent} color={TONE_CLASSES[tone].ring} />
    </Card>
  );
};

export default BudgetRow;
