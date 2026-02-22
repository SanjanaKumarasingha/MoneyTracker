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

import { useDarkMode } from '../../provider/DarkModeProvider';
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

const glassCard =
  'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow p-4 text-white';

const pillBtn =
  'px-3 py-1 rounded-xl text-sm border border-white/10 hover:bg-white/10 active:bg-white/15 transition';

const Trend = () => {
  const { isDarkMode } = useDarkMode();
  const { filterForTrend } = useRecord();

  const [categoryType, setCategoryType] = useState<TrendCategoryType>('expense');
  const [chartType, setChartType] = useState<TrendChartType>('bar');
  const [yearOffset, setYearOffset] = useState<number>(0);
  const [category, setCategory] = useState<ICategory | undefined>(undefined);

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
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

  const palette = useMemo(() => {
    // Dark blue + tree green vibe
    if (categoryType === 'expense') {
      return {
        line: 'rgba(34, 197, 94, 0.9)', // green
        fill: 'rgba(34, 197, 94, 0.25)',
      };
    }
    if (categoryType === 'income') {
      return {
        line: 'rgba(59, 130, 246, 0.9)', // blue
        fill: 'rgba(59, 130, 246, 0.25)',
      };
    }
    return {
      line: 'rgba(16, 185, 129, 0.9)', // emerald
      fill: 'rgba(16, 185, 129, 0.25)',
    };
  }, [categoryType]);

  const options: ChartOptions<'bar' | 'line'> = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: {
          display: chartType === 'bar',
          color: 'rgba(255,255,255,0.75)',
        },
        annotation: {
          annotations:
            values.length === 0
              ? {}
              : {
                  avgLine: {
                    type: 'line',
                    scaleID: 'y',
                    value: avg,
                    borderColor: 'rgba(255,255,255,0.35)',
                    borderDash: [10, 6],
                    borderWidth: 2,
                    label: {
                      display: false,
                      content: `Avg: ${avg.toFixed(2)}`,
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      padding: 6,
                      position: 'start',
                    },
                    enter({ element }) {
                      element.label!.options.display = true;
                      return true;
                    },
                    leave({ element }) {
                      element.label!.options.display = false;
                      return true;
                    },
                  },
                },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.7)' },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.12)' },
          ticks: { color: 'rgba(255,255,255,0.7)' },
        },
      },
    }),
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
    <div className={glassCard}>
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
          <CoreChart chartType={chartType} options={options} data={data} />
        )}
      </div>
    </div>
  );
};

export default Trend;