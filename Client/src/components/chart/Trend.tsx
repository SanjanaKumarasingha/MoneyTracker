import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ChartOptions,
  ChartData,
} from 'chart.js';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { DateTime } from 'luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Annotation from 'chartjs-plugin-annotation';
import { useQuery } from '@tanstack/react-query';

import { useRecord } from '../../provider/RecordDataProvider';
import { fetchCategories } from '../../apis/category';
import { ICategory } from '../../types';

import CategorySelector from '../record/CategorySelector';
import CustomSelector from '../Custom/CustomSelector';
import CoreChart from './CoreChart';
import {
  buildCartesianOptions,
  chartGlassCardClass,
  getSeriesPalette,
} from './chartTheme';

import { displayDate } from '../../common/format-date';
import { GroupByScale } from '../../common/group-scale.enum';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  Annotation,
);

type TrendCategoryType = 'expense' | 'income' | 'all';
type TrendChartType = 'bar' | 'line';

const pillBtn =
  'px-3 py-1 rounded-xl text-sm border border-white/10 hover:bg-white/10 active:bg-white/15 transition';

const Trend = () => {
  const { filterForTrend, favWallet } = useRecord();

  const [categoryType, setCategoryType] = useState<TrendCategoryType>('expense');
  const [chartType, setChartType] = useState<TrendChartType>('bar');
  const [yearOffset, setYearOffset] = useState<number>(0);
  const [category, setCategory] = useState<ICategory | undefined>(undefined);

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories', favWallet?.id],
    queryFn: () => fetchCategories(favWallet!.id),
    enabled: !!favWallet?.id,
  });

  // ✅ when switching to "all", category filtering doesn't make sense
  // so we clear selected category
  const effectiveCategory = categoryType === 'all' ? undefined : category;

  const trendRows = useMemo(() => {
    return filterForTrend(yearOffset, effectiveCategory);
  }, [filterForTrend, yearOffset, effectiveCategory]);

  const labels = useMemo(
    () => trendRows.map((row) => displayDate(row.date, GroupByScale.MONTH)),
    [trendRows],
  );

  const values = useMemo(() => {
    return trendRows.map((row) =>
      categoryType === 'all'
        ? Number((row.expense + row.income).toFixed(2))
        : Number(row[categoryType].toFixed(2)),
    );
  }, [trendRows, categoryType]);

  const total = useMemo(
    () => values.reduce((acc, v) => acc + v, 0),
    [values],
  );

  const avg = values.length > 0 ? total / values.length : 0;

  const palette = useMemo(() => getSeriesPalette(categoryType), [categoryType]);

  const options: ChartOptions<'bar' | 'line'> = useMemo(
    () => buildCartesianOptions(chartType, avg, values.length > 0),
    [chartType, values.length, avg],
  );

  const data: ChartData<'bar' | 'line'> = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          borderColor: palette.line,
          backgroundColor: palette.fill,
          hoverBackgroundColor: palette.line,
          borderWidth: 2,
          tension: 0.35,
          fill: chartType === 'line',
        },
      ],
    }),
    [labels, values, palette, chartType],
  );

  const yearLabel = DateTime.now().plus({ years: yearOffset }).year;

  const categoryOptions =
    categoryType === 'all'
      ? []
      : categories.filter((c) => c.type === categoryType).map((c) => c.name);

  return (
    <div className={chartGlassCardClass}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Trend</div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
            onClick={() => setYearOffset((p) => p - 1)}
            aria-label="Previous year"
          >
            <FiChevronLeft />
          </button>

          <div className="min-w-[80px] text-center font-medium">{yearLabel}</div>

          <button
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
            onClick={() => setYearOffset((p) => p + 1)}
            aria-label="Next year"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-white/70 text-sm">Type</div>
          <CategorySelector
            options={['income', 'expense', 'all']}
            value={categoryType}
            toggle={(t) => {
              const next = t as TrendCategoryType;
              setCategoryType(next);
              if (next === 'all') setCategory(undefined);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-white/70 text-sm">Chart</div>
          <div className="flex gap-2">
            <button
              className={clsx(pillBtn, chartType === 'bar' && 'bg-white/10')}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
            <button
              className={clsx(pillBtn, chartType === 'line' && 'bg-white/10')}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[220px]">
          <div className="text-white/70 text-sm">Category</div>
          <CustomSelector
            title=""
            options={categoryOptions}
            value={category?.name}
            callbackAction={(name: string) => {
              const found = categories.find((c) => c.name === name);
              if (found) setCategory(found);
            }}
            placeholder={categoryType === 'all' ? 'All categories' : 'Select'}
            disabled={categoryType === 'all'}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          Total: <span className="font-semibold">{total.toFixed(2)}</span>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          Avg: <span className="font-semibold">{avg.toFixed(2)}</span>
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          Points: <span className="font-semibold">{values.length}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6">
        {values.length === 0 ? (
          <div className="text-white/60 text-center py-10">
            No records for {yearLabel}
          </div>
        ) : (
          <div className="h-[320px] sm:h-[360px]">
            <CoreChart chartType={chartType} options={options} data={data} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Trend;
