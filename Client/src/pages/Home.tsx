import { AiOutlinePlus } from 'react-icons/ai';
import RecordModal from '../components/record/RecordModal';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useRecord } from '../provider/RecordDataProvider';
import { IRecord, IRecordWithCategory } from '../types';
import { useQuery } from '@tanstack/react-query';
import { fetchRecords } from '../apis/record';
import IconSelector from '../components/IconSelector';
import clsx from 'clsx';
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
import { GroupByScale } from '../common/group-scale.enum';
import { useDarkMode } from '../provider/DarkModeProvider';

type Props = {};

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);
const Home = (props: Props) => {
  const { isDarkMode } = useDarkMode();

  const [open, setOpen] = useState(false);

  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });

  const { favWallet, groupByCategoryRecords, groupBy, updateGroupingScale } =
    useRecord();

  const { data: records } = useQuery<IRecordWithCategory[]>(
    ['records', favWallet?.id],
    () => fetchRecords(favWallet!.id),
    {
      enabled: !!favWallet?.id,
    },
  );

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
    labels: Object.keys(groupByCategoryRecords?.records?.expense ?? {}),

    datasets: [
      {
        label: '# of Votes',
        data: Object.values(groupByCategoryRecords?.records?.expense ?? {}).map(
          (e) =>
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

  useEffect(() => {
    updateGroupingScale(GroupByScale.MONTH);
  }, [groupByCategoryRecords]);

  return (
    <div className="select-none">
      <div>Quick Access</div>
      <div className="flex gap-4 ">
        <div className="bg-primary-200 rounded-lg p-1 w-[300px] h-fit dark:bg-primary-600">
          Distribution of {groupByCategoryRecords.date}
          {Object.keys(groupByCategoryRecords.records?.expense ?? {}).length ===
            0 &&
          Object.keys(groupByCategoryRecords.records?.income ?? {}).length ===
            0 ? (
            <div>No record for {groupByCategoryRecords.date}</div>
          ) : (
            <Doughnut options={options} data={data}></Doughnut>
          )}
        </div>
        <div className="bg-info-300 rounded-lg p-1 w-[300px] h-fit dark:bg-info-700">
          <div className="flex justify-between items-center">
            <p>Latest Record</p>
            <div
              className="cursor-pointer hover:bg-info-200 rounded-full active:bg-info-100 p-1"
              onClick={() => {
                setOpen(true);
              }}
            >
              <AiOutlinePlus className="" />
            </div>
          </div>
          <div className="space-y-1">
            {/* Latest Records */}
            {records?.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-md bg-primary-100 p-1 dark:bg-primary-300"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      'text-white rounded-full p-1',
                      record.category.type === 'expense'
                        ? 'bg-rose-300'
                        : 'bg-info-300',
                    )}
                  >
                    <IconSelector name={record.category.icon} />
                  </div>
                  {record.category.name}
                </div>
                {favWallet?.currency} {record.price}
              </div>
            ))}
          </div>
        </div>
      </div>

      {open && (
        <RecordModal
          wallet={favWallet}
          setOpen={setOpen}
          editRecord={editRecord}
          setEditRecord={setEditRecord}
        />
      )}
    </div>
  );
};

export default Home;
