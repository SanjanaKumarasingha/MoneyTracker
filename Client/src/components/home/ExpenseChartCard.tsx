import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut } from 'react-chartjs-2';
import { BsPieChart } from 'react-icons/bs';
import { Card, EmptyState } from '../ui';
import { IGroupByCategoryRecord } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export interface ExpenseChartCardProps {
  periodLabel: string;
  records?: IGroupByCategoryRecord;
  isDarkMode: boolean;
  onAddRecord?: () => void;
}

const ExpenseChartCard = ({
  periodLabel,
  records,
  isDarkMode,
  onAddRecord,
}: ExpenseChartCardProps) => {
  const expenseByCategory = records?.expense ?? {};
  const incomeByCategory = records?.income ?? {};
  const hasData =
    Object.keys(expenseByCategory).length > 0 ||
    Object.keys(incomeByCategory).length > 0;

  const options: ChartOptions<'doughnut'> = {
    cutout: '30%',
    plugins: {
      legend: {
        labels: {
          font: {
            family: 'Barlow',
          },
          color: isDarkMode ? 'lightgray' : 'black',
        },
      },
      datalabels: {
        display: true,
        font: {
          size: 20,
          family: 'Barlow',
        },
        formatter: function (value, context) {
          return (context.chart.data.labels as [])[context.dataIndex];
        },
        anchor: 'end',
        offset: 0,
        align: 'start',
        color: isDarkMode ? 'lightgray' : 'darkgray',
      },
    },
  };

  const data: ChartData<'doughnut'> = {
    labels: Object.keys(expenseByCategory),
    datasets: [
      {
        label: '# of Votes',
        data: Object.values(expenseByCategory).map((e) =>
          e.reduce((acc, cur) => {
            return acc + Number(cur.price);
          }, 0),
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card title={`Spending Breakdown · ${periodLabel}`}>
      {hasData ? (
        <div className="max-w-md mx-auto">
          <Doughnut options={options} data={data} />
        </div>
      ) : (
        <EmptyState
          icon={<BsPieChart />}
          title={`No transactions in ${periodLabel}`}
          description="Add a record for this period to see your spending breakdown."
          actionLabel={onAddRecord ? 'Add a record' : undefined}
          onAction={onAddRecord}
        />
      )}
    </Card>
  );
};

export default ExpenseChartCard;
