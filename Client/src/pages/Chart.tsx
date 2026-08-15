import { useState } from 'react';
import PieChart from '../components/chart/PieChart';
import clsx from 'clsx';
import CustomSelector from '../components/Custom/CustomSelector';
import { useRecord } from '../provider/RecordDataProvider';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import Trend from '../components/chart/Trend';
import { Skeleton } from '../components/ui';

type Props = {};

const Chart = (props: Props) => {
  const [chartType, setChartType] = useState<'Pie Chart' | 'Trend'>(
    'Pie Chart',
  );

  const { wallets, favWallet } = useRecord();
  // Every other page (Home, Records, WalletPage) skeletons while wallets are
  // loading - this page used to render PieChart/Trend against
  // undefined/empty data with no indication anything was still in flight.
  const isLoading = !wallets;

  const dispatch = useAppDispatch();
  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex p-1 gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full w-fit">
          {(['Pie Chart', 'Trend'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setChartType(tab)}
              className={clsx(
                'px-3 py-1 text-sm font-semibold rounded-full transition-colors',
                chartType === tab
                  ? 'bg-primary-600 text-white shadow-card'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
              )}
            >
              {tab}
            </button>
          ))}
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

      {isLoading ? (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : chartType === 'Pie Chart' ? (
        <PieChart />
      ) : (
        <Trend />
      )}
    </div>
  );
};

export default Chart;
