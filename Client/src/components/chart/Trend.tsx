import { useRecord } from '../../provider/RecordDataProvider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  LineElement,
  PointElement,
} from 'chart.js';

import { useState } from 'react';
import CategorySelector from '../record/CategorySelector';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { DateTime } from 'luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Annotation from 'chartjs-plugin-annotation';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../../apis/category';
import { ICategory } from '../../types';
import CoreChart from './CoreChart';
import { useDarkMode } from '../../provider/DarkModeProvider';
import { displayDate } from '../../common/format-date';
import { GroupByScale } from '../../common/group-scale.enum';
import { Button, Card, EmptyState, Select } from '../ui';

type Props = {};

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
const Trend = (props: Props) => {
  const { isDarkMode } = useDarkMode();

  const [categoryType, setCategoryType] = useState<
    'expense' | 'income' | 'all'
  >('expense');

  const [category, setCategory] = useState<ICategory>();

  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const [currentYear, setCurrentYear] = useState<number>(0);

  const { data: categories } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { filterForTrend } = useRecord();

  const value = filterForTrend(currentYear, category);

  const total = value.reduce((year, cur) => {
    const v =
      categoryType === 'all'
        ? Number(cur.expense + cur.income)
        : Number(cur[categoryType]);
    return year + v;
  }, 0);

  const options: ChartOptions = {
    responsive: true,
    // Bar/line charts default to aspectRatio:2 (height = width/2) with no
    // cap of their own - on a wide desktop content column that's
    // 650-750px tall. maintainAspectRatio:false hands sizing entirely to
    // the fixed-height wrapper div below instead.
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      datalabels: {
        color: isDarkMode ? 'gray' : 'darkgray',
        display: chartType === 'bar',
      },
      annotation: {
        annotations: {
          avgLine: {
            type: 'line',
            scaleID: 'y',
            value: total / value.length,
            borderColor: '#F59E0B',
            borderDash: [10, 5], // length, gap
            borderWidth: 2,
            label: {
              display: false,
              drawTime: 'afterDatasetsDraw',
              content: `Average: ${(total / value.length).toFixed(2)}`,
            },
            enter({ element }, event) {
              element.label!.options.display = true;
              return true; // force update
            },
            leave({ element }, event) {
              element.label!.options.display = false;
              return true;
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          sampleSize: 2,
        },
        grid: { color: isDarkMode ? 'gray' : 'lightgray' },
        beginAtZero: true,
      },
    },
  };

  const labels = value.map((year) =>
    displayDate(year.date, GroupByScale.MONTH),
  );
  const data: ChartData = {
    labels,
    datasets: [
      {
        data: value.map((year) =>
          categoryType === 'all'
            ? Number((year.expense + year.income).toFixed(2))
            : Number(year[categoryType].toFixed(2)),
        ),
        borderColor:
          categoryType === 'expense'
            ? '#FECACA'
            : categoryType === 'income'
            ? '#DCFCE7'
            : '#FDE68A',
        backgroundColor:
          categoryType === 'expense'
            ? '#FECACA'
            : categoryType === 'income'
            ? '#DCFCE7'
            : '#FDE68A',
        hoverBackgroundColor:
          categoryType === 'expense'
            ? '#F87171'
            : categoryType === 'income'
            ? '#86EFAC'
            : '#FBBF24',
      },
    ],
  };
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          className="!rounded-full !p-1.5"
          aria-label="Previous year"
          onClick={() => setCurrentYear((prev) => prev - 1)}
        >
          <FiChevronLeft />
        </Button>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {DateTime.now().plus({ year: currentYear }).year}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="!rounded-full !p-1.5"
          aria-label="Next year"
          onClick={() => setCurrentYear((prev) => prev + 1)}
        >
          <FiChevronRight />
        </Button>
      </div>

      <CategorySelector
        options={['income', 'expense', 'all']}
        value={categoryType}
        toggle={(type) => {
          setCategoryType(type as 'expense' | 'income' | 'all');
          // A category picked while on "expense" is meaningless once you
          // switch to "income" (or "all") - it used to stick silently,
          // filtering the chart by a category of the wrong type with no
          // indication why the numbers suddenly looked wrong/empty.
          setCategory(undefined);
        }}
      />

      <div className="flex gap-2 flex-wrap items-end">
        <CategorySelector
          color={{
            selected: isDarkMode ? '#D97706' : '#FDE68A',
            background: isDarkMode ? '#92400E' : '#FEF3C7',
          }}
          options={['bar', 'line']}
          value={chartType}
          toggle={(type) => {
            setChartType(type as 'bar' | 'line');
          }}
        />

        {/* ui/Select instead of the old CustomSelector - that component's
            dropdown panel had no dark-mode styling at all (hardcoded
            bg-white), so its options list was unreadable in dark mode.
            "All categories" is a real option now too - previously, once you
            picked a category there was no way back to the unfiltered view
            short of reloading the page. */}
        <Select
          className="w-40"
          placeholder="All categories"
          filter
          options={[
            'All categories',
            ...(categories
              ?.filter((cat) => cat.type === categoryType)
              .map((cat) => cat.name) ?? []),
          ]}
          value={category?.name ?? 'All categories'}
          onChange={(value) => {
            if (value === 'All categories') {
              setCategory(undefined);
              return;
            }
            const targetCategory = categories?.find(
              (cat) => cat.name === value,
            );

            if (targetCategory) {
              setCategory(targetCategory);
            }
          }}
        />
      </div>

      {value.length === 0 ? (
        // Previously fell through to an empty chart canvas with no
        // explanation - and `total / value.length` (used by the average
        // annotation below) is a division by zero once value is empty.
        <EmptyState
          title="No data for this year"
          description="Try a different year or category using the controls above."
        />
      ) : (
        <div className="relative h-72">
          <CoreChart chartType={chartType} options={options} data={data} />
        </div>
      )}
    </Card>
  );
};

export default Trend;
