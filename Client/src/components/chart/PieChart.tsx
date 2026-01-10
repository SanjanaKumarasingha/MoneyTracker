import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import clsx from 'clsx';
import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ECategoryType } from '../../common/category-type';
import { GroupByScale } from '../../common/group-scale.enum';
import { EIconName } from '../../common/icon-name.enum';
import { useRecord } from '../../provider/RecordDataProvider';
import CategorySelector from '../record/CategorySelector';
import PercentRow from './PercentRow';
import ChartDataLabels from 'chartjs-plugin-datalabels';

type Props = {};

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);
const PieChart = (props: Props) => {
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

  const data = {
    labels: Object.keys(
      categoryType === ECategoryType.EXPENSE
        ? groupByCategoryRecords?.records?.expense ?? {}
        : groupByCategoryRecords?.records?.income ?? {},
    ),

    datasets: [
      {
        label: '# of Votes',
        data: Object.values(
          categoryType === ECategoryType.EXPENSE
            ? groupByCategoryRecords?.records?.expense ?? {}
            : groupByCategoryRecords?.records?.income ?? {},
        ).map((e) =>
          e.reduce((acc, cur) => {
            return acc + Number(cur.price);
          }, 0),
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
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
    <div className="flex gap-3">
      <div className="w-full sm:w-1/2 ">
        <div className="">
          <CategorySelector
            options={Object.values(ECategoryType)}
            value={categoryType}
            toggle={(type) => {
              setCategoryType(type as ECategoryType);
            }}
          />
          <div className="flex gap-2 p-1 flex-wrap">
            {Object.values(GroupByScale).map((gbs) => (
              <button
                className={clsx(
                  'hover:bg-rose-100 rounded-md p-1 active:bg-rose-50  dark:hover:bg-opacity-40 dark:active:bg-opacity-70',
                  {
                    'bg-rose-200 dark:bg-rose-400': groupBy === gbs,
                  },
                )}
                key={gbs}
                onClick={() => {
                  if (groupBy !== gbs) {
                    updateGroupingScale(gbs, true);
                  }
                }}
              >
                {gbs}
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <div
              className=" text-white bg-info-300 rounded-full p-1 hover:bg-info-200 active:bg-info-100 cursor-pointer"
              onClick={() => {
                updateCurrentDate('minus');
              }}
            >
              <FiChevronLeft className="" />
            </div>
            <div>{groupByCategoryRecords.date}</div>
            <div
              className=" right-0 text-white bg-info-300 rounded-full p-1 hover:bg-info-200 active:bg-info-100 cursor-pointer"
              onClick={() => {
                updateCurrentDate('plus');
              }}
            >
              <FiChevronRight className="" />
            </div>
          </div>
        </div>
        {Object.keys(groupByCategoryRecords.records?.expense ?? {}).length === 0 && Object.keys(groupByCategoryRecords.records?.income ?? {}).length === 0 ? (<div>No record for {groupByCategoryRecords.date}</div>):<Doughnut
          options={{
            cutout: '30%',
            plugins: {
              legend: {
                labels: {
                  font: {
                    family: 'Barlow',
                  },
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
              },
            },
          }}
          data={data}
        ></Doughnut>}
          
        
      </div>
      <div
        className={clsx(
          'flex-1',
          categoryType === ECategoryType.EXPENSE
            ? 'text-rose-400'
            : 'text-info-400',
        )}
      >
        <p className="text-3xl justify-between flex items-center">
          <span>
            Total {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}
          </span>
          <span>
            {categoryType === ECategoryType.EXPENSE
              ? expenseByDate.toFixed(2)
              : incomeByDate.toFixed(2)}
          </span>
        </p>

        <div className="w-full">
          {Object.keys(
            categoryType === ECategoryType.EXPENSE
              ? groupByCategoryRecords?.records?.expense ?? {}
              : groupByCategoryRecords?.records?.income ?? {},
          ).map((cat) => (
            <div key={cat} className="text-2xl">
              <PercentRow
                iconName={
                  groupByCategoryRecords?.records![categoryType][
                    cat as string
                  ][0].category.icon ?? EIconName.MONEY
                }
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
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;
