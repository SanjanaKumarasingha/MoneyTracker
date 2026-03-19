import { ChartData, ChartOptions } from 'chart.js';

type ChartMode = 'dark' | 'light';
type CategorySeries = 'expense' | 'income' | 'all';

const doughnutBackgroundColors = [
  'rgba(16, 185, 129, 0.35)',
  'rgba(59, 130, 246, 0.32)',
  'rgba(14, 165, 233, 0.3)',
  'rgba(99, 102, 241, 0.28)',
  'rgba(34, 197, 94, 0.3)',
  'rgba(6, 182, 212, 0.28)',
];

const doughnutBorderColors = [
  'rgba(16, 185, 129, 0.95)',
  'rgba(59, 130, 246, 0.95)',
  'rgba(14, 165, 233, 0.95)',
  'rgba(99, 102, 241, 0.92)',
  'rgba(34, 197, 94, 0.92)',
  'rgba(6, 182, 212, 0.92)',
];

export const chartGlassCardClass =
  'rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow backdrop-blur-xl';

export const buildDoughnutOptions = (
  mode: ChartMode,
): ChartOptions<'doughnut'> => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '58%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color:
          mode === 'dark' ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.72)',
        font: { family: 'Barlow', size: 12 },
        boxWidth: 10,
        boxHeight: 10,
        padding: 14,
      },
    },
    datalabels: {
      color:
        mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.68)',
      font: { family: 'Barlow', size: 11, weight: 600 },
      formatter: (_value, context) =>
        context.chart.data.labels?.[context.dataIndex] ?? '',
    },
  },
});

export const buildDoughnutData = (
  labels: string[],
  values: number[],
  datasetLabel: string,
): ChartData<'doughnut'> => ({
  labels,
  datasets: [
    {
      label: datasetLabel,
      data: values,
      backgroundColor: doughnutBackgroundColors,
      borderColor: doughnutBorderColors,
      borderWidth: 1.5,
      hoverBorderWidth: 2,
    },
  ],
});

export const getSeriesPalette = (series: CategorySeries) => {
  if (series === 'expense') {
    return {
      line: 'rgba(16, 185, 129, 0.95)',
      fill: 'rgba(16, 185, 129, 0.24)',
    };
  }

  if (series === 'income') {
    return {
      line: 'rgba(59, 130, 246, 0.95)',
      fill: 'rgba(59, 130, 246, 0.24)',
    };
  }

  return {
    line: 'rgba(14, 165, 233, 0.95)',
    fill: 'rgba(14, 165, 233, 0.24)',
  };
};

export const buildCartesianOptions = (
  chartType: 'bar' | 'line',
  avg: number,
  hasValues: boolean,
): ChartOptions<'bar' | 'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
    datalabels: {
      display: chartType === 'bar',
      color: 'rgba(255,255,255,0.76)',
      font: { family: 'Barlow', weight: 600 },
    },
    annotation: {
      annotations: !hasValues
        ? {}
        : {
            avgLine: {
              type: 'line',
              scaleID: 'y',
              value: avg,
              borderColor: 'rgba(255,255,255,0.3)',
              borderDash: [10, 6],
              borderWidth: 2,
              label: {
                display: false,
                content: `Avg: ${avg.toFixed(2)}`,
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.42)',
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
      ticks: { color: 'rgba(255,255,255,0.72)' },
      border: { color: 'rgba(255,255,255,0.12)' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255,255,255,0.12)' },
      ticks: { color: 'rgba(255,255,255,0.72)' },
      border: { color: 'rgba(255,255,255,0.12)' },
    },
  },
});
