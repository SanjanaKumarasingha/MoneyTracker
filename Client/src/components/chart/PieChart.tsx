import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PiChartPieSliceThin } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import { ECategoryType } from '../../common/category-type';
import { EGoalType } from '../../common/goal-type.enum';
import { GroupByScale } from '../../common/group-scale.enum';
import { groupByScaleLabel } from '../../common/format-date';
import { EIconName } from '../../common/icon-name.enum';
import { useRecord } from '../../provider/RecordDataProvider';
import { useAllGoals } from '../../hooks/useAllGoals';
import CategoryBreakdownRow from './CategoryBreakdownRow';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { getCategoryColor } from '../../utils/categoryColor';
import { formatMoney } from '../../utils';
import { PERIOD_LABELS } from '../goal/labels';
import { Button, Card, EmptyState, SegmentedControl } from '../ui';

type Props = {};

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// Quarter is offered here (unlike Records) since it's a natural reporting
// cadence for spending analysis; Day is intentionally not - a one-day donut
// is one or two slices and not an analysis.
const SCALES = [
  GroupByScale.WEEK,
  GroupByScale.MONTH,
  GroupByScale.QUARTER,
  GroupByScale.YEAR,
  GroupByScale.ALL,
];
const SCALE_OPTIONS = SCALES.map((value) => ({ value, label: groupByScaleLabel[value] }));

const TYPE_OPTIONS = [
  { value: ECategoryType.EXPENSE, label: 'Expenses' },
  { value: ECategoryType.INCOME, label: 'Income' },
];

const PieChart = (props: Props) => {
  const navigate = useNavigate();
  const {
    incomeByDate,
    expenseByDate,
    groupByCategoryRecords,
    groupBy,
    updateGroupingScale,
    updateCurrentDate,
    favWallet,
    scopeWallet,
    allWalletsMode,
  } = useRecord();
  const { goals } = useAllGoals();

  const [categoryType, setCategoryType] = useState<ECategoryType>(ECategoryType.EXPENSE);

  // The provider's grouping scale is shared, app-wide state that starts at
  // ALL - open Charts on the current month like every other page does.
  useEffect(() => {
    updateGroupingScale(GroupByScale.MONTH, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isExpense = categoryType === ECategoryType.EXPENSE;
  const categoryRecordsByLabel =
    (isExpense ? groupByCategoryRecords?.records?.expense : groupByCategoryRecords?.records?.income) ?? {};
  const total = Math.abs(isExpense ? expenseByDate : incomeByDate);
  const hasRecords = Object.keys(categoryRecordsByLabel).length > 0;
  const currency = scopeWallet?.currency;

  // Largest first, so the list and the donut read in the same order.
  const rows = useMemo(
    () =>
      Object.entries(categoryRecordsByLabel)
        .map(([name, records]) => ({
          name,
          category: records[0]?.category,
          amount: records.reduce((acc, cur) => acc + Number(cur.price), 0),
        }))
        .sort((a, b) => b.amount - a.amount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupByCategoryRecords, categoryType],
  );

  // Budget limits (expense) / saving targets (income) for this wallet's
  // categories, so each row can show how it stands against its own cap.
  const goalByCategory = useMemo(() => {
    const wantedType = isExpense ? EGoalType.SPENDING_LIMIT : EGoalType.SAVING;
    const map = new Map<number, (typeof goals)[number]>();
    // A limit belongs to one wallet, so comparing it against spending summed
    // across every wallet would be misleading - show limits per wallet only.
    if (allWalletsMode) return map;
    goals.forEach((goal) => {
      if (
        goal.type === wantedType &&
        goal.category &&
        goal.wallet.id === favWallet?.id &&
        goal.progress.isActive
      ) {
        map.set(goal.category.id, goal);
      }
    });
    return map;
  }, [goals, isExpense, favWallet?.id, allWalletsMode]);

  const data = {
    labels: rows.map((row) => row.name),
    datasets: [
      {
        data: rows.map((row) => row.amount),
        backgroundColor: rows.map((row) => getCategoryColor(row.category?.id)),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      <Card padding="md" className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          aria-label="Category type"
          options={TYPE_OPTIONS}
          value={categoryType}
          onChange={setCategoryType}
        />

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label="Date range"
            size="sm"
            options={SCALE_OPTIONS}
            value={groupBy}
            onChange={(next) => {
              if (groupBy !== next) updateGroupingScale(next, true);
            }}
          />

          {groupBy !== GroupByScale.ALL && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="!rounded-full !p-1.5"
                aria-label="Previous period"
                onClick={() => updateCurrentDate('minus')}
              >
                <FiChevronLeft />
              </Button>
              <span className="min-w-32 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {groupByCategoryRecords.date}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="!rounded-full !p-1.5"
                aria-label="Next period"
                onClick={() => updateCurrentDate('plus')}
              >
                <FiChevronRight />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {!hasRecords ? (
        <Card>
          <EmptyState
            icon={<PiChartPieSliceThin />}
            title={`No ${categoryType} records`}
            description={`Nothing recorded for ${groupByCategoryRecords.date} yet. Try a different period above.`}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Glass container: translucent + blurred surface over the page
              instead of a flat card, so the donut is the focal object. */}
          <Card
            padding="lg"
            className="flex flex-col items-center justify-center gap-4 backdrop-blur-xl bg-white/70 dark:bg-white/[0.04]"
          >
            {/* Bounded box: chart.js has no size cap of its own (a doughnut
                defaults to aspectRatio 1 and grows with its parent's width). */}
            <div className="relative h-72 w-72 max-w-full sm:h-80 sm:w-80">
              <Doughnut
                data={data}
                options={{
                  cutout: '62%',
                  maintainAspectRatio: false,
                  layout: { padding: 8 },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) =>
                          ` ${formatMoney(Number(ctx.parsed), currency)} (${((Number(ctx.parsed) / total) * 100).toFixed(1)}%)`,
                      },
                    },
                    // Percent printed inside each slice; slices under 5% are
                    // too thin to hold a label, the list beside it covers them.
                    datalabels: {
                      color: '#ffffff',
                      font: { weight: 'bold', size: 12 },
                      display: (ctx) => {
                        const value = Number(ctx.dataset.data[ctx.dataIndex]);
                        return total > 0 && value / total >= 0.05;
                      },
                      formatter: (value: number) => `${((value / total) * 100).toFixed(0)}%`,
                    },
                  },
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Total {isExpense ? 'spent' : 'earned'}
                </span>
                <span
                  className={clsx(
                    'px-8 text-2xl font-extrabold leading-tight',
                    isExpense
                      ? 'text-danger-600 dark:text-danger-400'
                      : 'text-success-600 dark:text-success-400',
                  )}
                >
                  {formatMoney(total, currency)}
                </span>
                <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {rows.length} categor{rows.length === 1 ? 'y' : 'ies'}
                </span>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">By category</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Tap a row to see its records
              </span>
            </div>
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {rows.map((row) => {
                const goal = row.category ? goalByCategory.get(row.category.id) : undefined;
                return (
                  <CategoryBreakdownRow
                    key={row.name}
                    name={row.name}
                    iconName={row.category?.icon ?? EIconName.MONEY}
                    color={getCategoryColor(row.category?.id)}
                    amount={row.amount}
                    total={total}
                    currency={currency}
                    limit={
                      goal
                        ? {
                            target: Number(goal.targetAmount),
                            periodLabel: PERIOD_LABELS[goal.periodType].toLowerCase(),
                            kind: goal.type === EGoalType.SAVING ? 'target' : 'limit',
                          }
                        : null
                    }
                    onClick={() => navigate('/records', { state: { categoryFilter: row.name } })}
                  />
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PieChart;
