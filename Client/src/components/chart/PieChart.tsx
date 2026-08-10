import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import clsx from 'clsx';
import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { ECategoryType } from '../../common/category-type';
import { GroupByScale } from '../../common/group-scale.enum';
import { EIconName } from '../../common/icon-name.enum';
import { useRecord } from '../../provider/RecordDataProvider';
import CategorySelector from '../record/CategorySelector';
import PercentRow from './PercentRow';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { getCategoryColor } from '../../utils/categoryColor';

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
  } = useRecord();

  const [categoryType, setCategoryType] = useState<ECategoryType>(
    ECategoryType.EXPENSE,
  );

  const categoryRecordsByLabel =
    categoryType === ECategoryType.EXPENSE
      ? groupByCategoryRecords?.records?.expense ?? {}
      : groupByCategoryRecords?.records?.income ?? {};

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
                  'hover:bg-primary-100 rounded-md p-1 active:bg-primary-50  dark:hover:bg-opacity-40 dark:active:bg-opacity-70',
                  {
                    'bg-primary-200 dark:bg-primary-400': groupBy === gbs,
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
              className=" text-white bg-primary-300 rounded-full p-1 hover:bg-primary-200 active:bg-primary-100 cursor-pointer"
              onClick={() => {
                updateCurrentDate('minus');
              }}
            >
              <FiChevronLeft className="" />
            </div>
            <div>{groupByCategoryRecords.date}</div>
            <div
              className=" right-0 text-white bg-primary-300 rounded-full p-1 hover:bg-primary-200 active:bg-primary-100 cursor-pointer"
              onClick={() => {
                updateCurrentDate('plus');
              }}
            >
              <FiChevronRight className="" />
            </div>
          </div>
        </div>
        {Object.keys(groupByCategoryRecords.records?.expense ?? {}).length === 0 && Object.keys(groupByCategoryRecords.records?.income ?? {}).length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
            No record for {groupByCategoryRecords.date}
          </div>
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
                {(categoryType === ECategoryType.EXPENSE
                  ? expenseByDate
                  : incomeByDate
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1">
        {/* The total is now shown centered inside the doughnut's cutout
            (left) - repeating it here in giant text too was the main
            contributor to this panel feeling oversized. */}
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          By category
        </p>

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
                onClick={() => navigate('/records', { state: { categoryFilter: cat } })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;
