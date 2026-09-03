import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import clsx from 'clsx';
import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PiChartPieSliceThin } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import { ECategoryType } from '../../common/category-type';
import { GroupByScale } from '../../common/group-scale.enum';
import { groupByScaleLabel } from '../../common/format-date';
import { EIconName } from '../../common/icon-name.enum';
import { useRecord } from '../../provider/RecordDataProvider';
import CategorySelector from '../record/CategorySelector';
import PercentRow from './PercentRow';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { getCategoryColor } from '../../utils/categoryColor';
import { formatMoney } from '../../utils';
import { Button, Card, EmptyState } from '../ui';

type Props = {};

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);
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
  } = useRecord();

  const [categoryType, setCategoryType] = useState<ECategoryType>(
    ECategoryType.EXPENSE,
  );

  const categoryRecordsByLabel =
    categoryType === ECategoryType.EXPENSE
      ? groupByCategoryRecords?.records?.expense ?? {}
      : groupByCategoryRecords?.records?.income ?? {};

  const hasRecords = Object.keys(categoryRecordsByLabel).length > 0;

  // Same fixed per-category color used everywhere else in the app (see
  // utils/categoryColor.ts) - a category's slice is now the same color as
  // its icon chip below and its dot on Home's Top Spending list, instead of
  // an arbitrary chart.js default palette.
  const sliceColors = Object.values(categoryRecordsByLabel).map(
    (records) => getCategoryColor(records[0]?.category?.id),
  );

  const data = {
    labels: Object.keys(categoryRecordsByLabel),

    datasets: [
      {
        label: '# of Votes',
        data: Object.values(categoryRecordsByLabel).map((e) =>
          e.reduce((acc, cur) => {
            return acc + Number(cur.price);
          }, 0),
        ),
        backgroundColor: sliceColors,
        borderColor: sliceColors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <Card padding="md" className="w-full lg:w-1/2 flex flex-col gap-3">
        <CategorySelector
          options={Object.values(ECategoryType)}
          value={categoryType}
          toggle={(type) => {
            setCategoryType(type as ECategoryType);
          }}
        />

        {/* Scale picker - a proper segmented control with friendly labels
            (the enum values themselves, e.g. "QUARTER", used to be printed
            directly as plain-text buttons wrapping awkwardly). */}
        <div className="flex gap-1 flex-wrap">
          {Object.values(GroupByScale).map((gbs) => (
            <button
              key={gbs}
              type="button"
              onClick={() => {
                if (groupBy !== gbs) {
                  updateGroupingScale(gbs, true);
                }
              }}
              className={clsx(
                'text-sm rounded-full px-3 py-1 transition-colors',
                groupBy === gbs
                  ? 'bg-primary-600 text-white font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600',
              )}
            >
              {groupByScaleLabel[gbs]}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="!rounded-full !p-1.5"
            aria-label="Previous period"
            onClick={() => updateCurrentDate('minus')}
          >
            <FiChevronLeft />
          </Button>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {groupByCategoryRecords.date}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="!rounded-full !p-1.5"
            aria-label="Next period"
            onClick={() => updateCurrentDate('plus')}
          >
            <FiChevronRight />
          </Button>
        </div>

        {!hasRecords ? (
          <EmptyState
            icon={<PiChartPieSliceThin />}
            title={`No ${categoryType} records`}
            description={`Nothing recorded for ${groupByCategoryRecords.date} yet. Try a different period above.`}
          />
        ) : (
          // Bounded height/width (chart.js has no size cap of its own - a
          // doughnut defaults to aspectRatio:1, so it renders as tall as
          // its parent is wide, which on a wide desktop is 650-700px+
          // without this). The per-category name used to be printed on the
          // ring itself at a flat 20px, which collided once there were more
          // than ~5-6 categories - the PercentRow list to the right already
          // shows name/icon/amount/percent, so the ring itself now only
          // needs to show the total, centered in the cutout.
          <div className="relative w-full max-w-xs mx-auto h-64">
            <Doughnut
              options={{
                cutout: '65%',
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  datalabels: { display: false },
                },
              }}
              data={data}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                Total {categoryType}
              </span>
              <span
                className={clsx(
                  'text-xl font-bold',
                  categoryType === ECategoryType.EXPENSE
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-success-600 dark:text-success-400',
                )}
              >
                {formatMoney(
                  categoryType === ECategoryType.EXPENSE
                    ? expenseByDate
                    : incomeByDate,
                  favWallet?.currency,
                )}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card padding="md" className="flex-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          By category
        </p>

        {!hasRecords ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center">
            Category breakdown will appear here once there's something to show.
          </p>
        ) : (
          <div className="w-full">
            {Object.keys(categoryRecordsByLabel).map((cat) => (
              <div key={cat} className="text-base">
                <PercentRow
                  name={cat}
                  iconName={
                    groupByCategoryRecords?.records![categoryType][
                      cat as string
                    ][0].category?.icon ?? EIconName.MONEY
                  }
                  color={getCategoryColor(
                    groupByCategoryRecords?.records![categoryType][
                      cat as string
                    ][0].category?.id,
                  )}
                  value={Math.abs(
                    groupByCategoryRecords?.records![categoryType][
                      cat as string
                    ].reduce((acc, cur) => {
                      return acc + Number(cur.price);
                    }, 0),
                  )}
                  total={
                    categoryType === ECategoryType.EXPENSE
                      ? Math.abs(expenseByDate)
                      : Math.abs(incomeByDate)
                  }
                  onClick={() =>
                    navigate('/records', { state: { categoryFilter: cat } })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PieChart;
