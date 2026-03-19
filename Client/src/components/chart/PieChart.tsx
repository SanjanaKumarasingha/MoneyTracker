import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ECategoryType } from '../../common/category-type';
import { GroupByScale } from '../../common/group-scale.enum';
import { EIconName } from '../../common/icon-name.enum';
import { useRecord } from '../../provider/RecordDataProvider';
import CategorySelector from '../record/CategorySelector';
import PercentRow from './PercentRow';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  buildDoughnutData,
  buildDoughnutOptions,
  chartGlassCardClass,
} from './chartTheme';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = () => {
  const {
    incomeByDate,
    expenseByDate,
    groupByCategoryRecords,
    groupBy,
    updateGroupingScale,
    updateCurrentDate,
  } = useRecord();

  const [categoryType, setCategoryType] = useState<ECategoryType>(
    ECategoryType.EXPENSE,
  );

  const records =
    categoryType === ECategoryType.EXPENSE
      ? groupByCategoryRecords?.records?.expense ?? {}
      : groupByCategoryRecords?.records?.income ?? {};

  /* ======================= PRECOMPUTE ======================= */

  const labels = useMemo(() => Object.keys(records), [records]);

  const values = useMemo(
    () =>
      Object.values(records).map((arr) =>
        arr.reduce((acc, cur) => acc + Number(cur.price), 0),
      ),
    [records],
  );

  const total =
    categoryType === ECategoryType.EXPENSE
      ? Math.abs(expenseByDate)
      : Math.abs(incomeByDate);

  /* ======================= CHART ======================= */

  const data: ChartData<'doughnut'> = useMemo(
    () => buildDoughnutData(labels, values, `${categoryType} distribution`),
    [categoryType, labels, values],
  );

  const options: ChartOptions<'doughnut'> = useMemo(
    () => buildDoughnutOptions('dark'),
    [],
  );

  /* ======================= UI ======================= */

  const hasNoData = labels.length === 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-white">
      {/* LEFT PANEL */}
      <div className={clsx(chartGlassCardClass, 'w-full lg:w-1/2')}>
        <CategorySelector
          options={Object.values(ECategoryType)}
          value={categoryType}
          toggle={(type) => setCategoryType(type as ECategoryType)}
        />

        {/* Grouping */}
        <div className="flex gap-2 flex-wrap mt-3">
          {Object.values(GroupByScale).map((gbs) => (
            <button
              key={gbs}
              className={clsx(
                'px-3 py-1 rounded-xl text-sm border transition-all',
                'border-white/10 hover:bg-white/10',
                groupBy === gbs && 'bg-emerald-500/20 border-emerald-400/30',
              )}
              onClick={() => {
                if (groupBy !== gbs) updateGroupingScale(gbs, true);
              }}
            >
              {gbs}
            </button>
          ))}
        </div>

        {/* Date Navigator */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
            onClick={() => updateCurrentDate('minus')}
          >
            <FiChevronLeft />
          </button>

          <span className="text-lg font-medium">
            {groupByCategoryRecords.date}
          </span>

          <button
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
            onClick={() => updateCurrentDate('plus')}
          >
            <FiChevronRight />
          </button>
        </div>

        {/* Chart */}
        <div className="mt-6">
          {hasNoData ? (
            <div className="text-white/60 text-center">
              No records for {groupByCategoryRecords.date}
            </div>
          ) : (
            <div className="mx-auto h-[280px] max-w-[320px] sm:h-[320px]">
              <Doughnut options={options} data={data} />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={clsx(chartGlassCardClass, 'flex-1')}>
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold">
            Total {categoryType}
          </span>
          <span className="text-xl font-semibold text-emerald-300">
            {total.toFixed(2)}
          </span>
        </div>

        {labels.map((cat) => {
          const categoryRecords = records[cat];
          const value = Math.abs(
            categoryRecords.reduce(
              (acc, cur) => acc + Number(cur.price),
              0,
            ),
          );

          return (
            <PercentRow
              key={cat}
              iconName={
                categoryRecords?.[0]?.category.icon ?? EIconName.MONEY
              }
              value={value}
              total={total}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PieChart;
