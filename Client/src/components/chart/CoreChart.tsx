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
  ChartData,
  ChartOptions,
  ArcElement,
  ChartType,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Annotation from 'chartjs-plugin-annotation';
import { Bar, Line } from 'react-chartjs-2';

type CoreChartProps = {
  chartType: 'bar' | 'line';
  options: ChartOptions;
  data: ChartData;
};
ChartJS.register(
  ArcElement,
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

const CoreChart = ({ chartType, options, data }: CoreChartProps) => {
  return (
    <>
      {chartType === 'bar' ? (
        <Bar
          options={options as ChartOptions<'bar'>}
          data={data as ChartData<'bar'>}
        />
      ) : (
        <Line
          options={options as ChartOptions<'line'>}
          data={data as ChartData<'line'>}
        />
      )}
    </>
  );
};

export default CoreChart;
