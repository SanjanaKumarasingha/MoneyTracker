import { useState } from 'react';
import PieChart from '../components/chart/PieChart';
import clsx from 'clsx';
import CustomSelector from '../components/Custom/CustomSelector';
import { useRecord } from '../provider/RecordDataProvider';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import Trend from '../components/chart/Trend';

type Props = {};

const Chart = (props: Props) => {
  const [chartType, setChartType] = useState<'Pie Chart' | 'Trend'>(
    'Pie Chart',
  );

  const { wallets, favWallet } = useRecord();

  const dispatch = useAppDispatch();
  return (
    <div>
      <div className=" flex justify-between">
        <div className="flex py-2">
          <div
            className={clsx(
              'px-2 hover:bg-info-100 cursor-pointer rounded-t-md active:bg-info-50 dark:bg-opacity-40 dark:active:bg-opacity-70',
              { 'bg-info-200 dark:bg-info-700': chartType === 'Pie Chart' },
            )}
            onClick={() => {
              setChartType('Pie Chart');
            }}
          >
            Pie Chart
          </div>
          <div
            className={clsx(
              'px-2 hover:bg-info-100 cursor-pointer rounded-t-md active:bg-info-50 dark:bg-opacity-40 dark:active:bg-opacity-70',
              { 'bg-info-200 dark:bg-info-700': chartType === 'Trend' },
            )}
            onClick={() => {
              setChartType('Trend');
            }}
          >
            Trend
          </div>
        </div>
        <div className="text-sm">
          <CustomSelector
            title={'Wallet:'}
            titlePosition="left"
            options={wallets?.map((w) => w.name) ?? []}
            value={favWallet?.name}
            callbackAction={(value) => {
              const newFavWallet = wallets?.find((w) => w.name === value);
              if (newFavWallet) {
                dispatch(updateFavWallet(newFavWallet.id));
              }
            }}
          />
        </div>
      </div>

      {chartType === 'Pie Chart' ? <PieChart /> : <Trend />}
    </div>
  );
};

export default Chart;
