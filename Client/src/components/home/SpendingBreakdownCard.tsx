import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { BsPieChart } from 'react-icons/bs';
import { Button, Card, EmptyState, ProgressBar } from '../ui';
import { formatMoney } from '../../utils';
import { CategorySpend } from '../../utils/portfolio';
import { TONE_CLASSES } from '../../utils/goalStatus';

ChartJS.register(ArcElement, Tooltip);

export interface BudgetPacing {
  spent: number;
  limit: number;
}

export interface SpendingBreakdownCardProps {
  monthLabel: string;
  currency: string;
  categories: CategorySpend[];
  /** Combined monthly spending limits for this currency; null = none set. */
  pacing: BudgetPacing | null;
  /** Fraction (0-1) of the month already elapsed. */
  monthElapsed: number;
}

const TOP_N = 5;

// Where this month's money went (donut + ranked categories), and - if a
// monthly limit exists - whether spending is running ahead of the calendar.
// "Pacing" compares % of budget used against % of the month gone: 60% spent
// by day 15 of 30 is over-pace even though you're nowhere near the limit yet.
const SpendingBreakdownCard = ({
  monthLabel,
  currency,
  categories,
  pacing,
  monthElapsed,
}: SpendingBreakdownCardProps) => {
  const navigate = useNavigate();
  const total = categories.reduce((sum, category) => sum + category.amount, 0);

  const top = categories.slice(0, TOP_N);
  const restAmount = categories.slice(TOP_N).reduce((sum, category) => sum + category.amount, 0);
  const slices = restAmount > 0
    ? [...top, { categoryId: -1, name: 'Other', color: '#94a3b8', amount: restAmount }]
    : top;

  const usedPercent = pacing && pacing.limit > 0 ? (pacing.spent / pacing.limit) * 100 : 0;
  const elapsedPercent = monthElapsed * 100;
  const projected = monthElapsed > 0 && pacing ? pacing.spent / monthElapsed : 0;
  const overPace = pacing !== null && usedPercent > elapsedPercent + 5;
  const tone = usedPercent >= 100 ? 'danger' : overPace ? 'warning' : 'success';

  return (
    <Card padding="none" className="flex flex-col">
      <div className="px-5 pt-4 pb-3">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Spending breakdown</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{monthLabel}</p>
      </div>

      <div className="flex flex-col gap-5 border-t border-zinc-100 dark:border-white/[0.06] px-5 py-5">
        {total === 0 ? (
          <EmptyState
            icon={<BsPieChart />}
            title="No spending yet"
            description={`Expenses recorded in ${monthLabel} will be broken down here.`}
          />
        ) : (
          <>
            <div className="relative mx-auto h-44 w-44">
              <Doughnut
                data={{
                  labels: slices.map((slice) => slice.name),
                  datasets: [
                    {
                      data: slices.map((slice) => slice.amount),
                      backgroundColor: slices.map((slice) => slice.color),
                      borderWidth: 0,
                      hoverOffset: 4,
                    },
                  ],
                }}
                options={{
                  cutout: '72%',
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    // chartjs-plugin-datalabels is registered globally (see
                    // chart/PieChart.tsx) and would otherwise print raw
                    // values on every slice of this smaller donut too.
                    datalabels: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${formatMoney(Number(ctx.parsed), currency)}`,
                      },
                    },
                  },
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Spent
                </span>
                <span className="px-6 text-base font-extrabold leading-tight text-zinc-900 dark:text-zinc-50">
                  {formatMoney(total, currency)}
                </span>
              </div>
            </div>

            <ul className="flex flex-col gap-2.5">
              {slices.map((slice) => (
                <li key={slice.categoryId} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="flex-1 truncate text-zinc-700 dark:text-zinc-200">{slice.name}</span>
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatMoney(slice.amount, currency)}
                  </span>
                  <span className="w-11 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {((slice.amount / total) * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] p-3">
          {pacing ? (
            <>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Budget pacing</p>
                <p className={clsx('text-xs font-bold', TONE_CLASSES[tone].text)}>
                  {usedPercent >= 100 ? 'Over budget' : overPace ? 'Ahead of pace' : 'On pace'}
                </p>
              </div>
              <ProgressBar
                size="md"
                percent={usedPercent}
                barClassName={TONE_CLASSES[tone].bar}
                markerPercent={elapsedPercent}
                label="Monthly budget used"
              />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {formatMoney(pacing.spent, currency)} of {formatMoney(pacing.limit, currency)} (
                {Math.round(usedPercent)}%) with {Math.round(elapsedPercent)}% of the month gone
                {projected > 0 && ` · on course for ${formatMoney(projected, currency)}`}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Set a monthly budget to see if you're on pace.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/goals')}>
                Set budget
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SpendingBreakdownCard;
