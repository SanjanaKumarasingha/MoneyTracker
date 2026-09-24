import { LuTarget } from 'react-icons/lu';
import { IoWarningOutline } from 'react-icons/io5';
import { IGoalWithProgress } from '../../types';
import { PERIOD_LABELS } from './labels';
import { TONE_CLASSES, daysLeft, getScheduleStatus, getScheduleTone } from '../../utils/goalStatus';
import { formatMoney } from '../../utils';
import IconSelector from '../IconSelector';
import { Card, Money, ProgressBar } from '../ui';

export interface SavingGoalCardProps {
  goal: IGoalWithProgress;
  onClick: () => void;
}

// Saving goal: how much of the target has been put aside this period, and
// whether the pace to get there is healthy. Amber is the "goals" color, so
// the icon chip is amber; the *bar* color is status (on pace / slipping /
// behind), not identity, so it stays legible at a glance.
const SavingGoalCard = ({ goal, onClick }: SavingGoalCardProps) => {
  const { wallet, progress } = goal;
  const percent = Math.max(0, Math.min(100, progress.percent));
  const schedule = getScheduleStatus(goal);
  const tone = getScheduleTone(schedule?.ratio ?? null);
  const target = Number(goal.targetAmount);
  const remaining = Math.max(0, target - progress.actual);
  const left = daysLeft(goal);
  const met = progress.status === 'met';

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-warning-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-500/15 text-xl text-warning-600 dark:text-warning-400">
          {goal.category ? <IconSelector name={goal.category.icon} /> : <LuTarget />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {goal.name || 'Savings goal'}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {wallet.name}
            {goal.category ? ` · ${goal.category.name}` : ''} · {PERIOD_LABELS[goal.periodType]}
          </p>
        </div>
        {met ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TONE_CLASSES.success.soft}`}>
            Goal met
          </span>
        ) : (
          schedule && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TONE_CLASSES[tone].soft}`}>
              {tone === 'success' ? 'On track' : 'Needs attention'}
            </span>
          )
        )}
      </div>

      <p>
        <Money amount={progress.actual} currency={wallet.currency} className="text-2xl" />
        <span className="ml-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          of {formatMoney(target, wallet.currency)}
        </span>
      </p>

      <ProgressBar
        size="md"
        percent={percent}
        barClassName={TONE_CLASSES[met ? 'success' : tone].bar}
        label={`${goal.name || 'Savings goal'} progress`}
      />

      <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <span>{Math.round(percent)}% saved</span>
        <span>
          {formatMoney(remaining, wallet.currency)} left
          {left !== null && ` · ${left} day${left === 1 ? '' : 's'} to go`}
        </span>
      </div>

      {schedule && schedule.gapPercent > 5 && !met && (
        <p className="flex w-fit items-center gap-1.5 rounded-md border border-danger-500/30 bg-danger-500/10 px-2 py-1 text-xs font-semibold text-danger-700 dark:text-danger-300">
          <IoWarningOutline />
          {schedule.gapPercent}% behind schedule
        </p>
      )}
    </Card>
  );
};

export default SavingGoalCard;
