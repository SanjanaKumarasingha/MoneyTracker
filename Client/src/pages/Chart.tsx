import { useState } from 'react';
import PieChart from '../components/chart/PieChart';
import clsx from 'clsx';
import { useRecord } from '../provider/RecordDataProvider';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import Trend from '../components/chart/Trend';
import { Card, Select, Skeleton } from '../components/ui';

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
    <div className="space-y-3">
      <Card padding="sm" className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex p-1 gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-full w-fit">
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

        {/* ui/Select instead of the old CustomSelector - that component's
            dropdown panel had no dark-mode styling at all (hardcoded
            bg-white), so its options list was unreadable in dark mode. */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
            Wallet
          </span>
          <Select
            className="sm:w-48"
            options={wallets?.map((w) => w.name) ?? []}
            value={favWallet?.name ?? ''}
            placeholder="Select a wallet"
            onChange={(value) => {
              const newFavWallet = wallets?.find((w) => w.name === value);
              if (newFavWallet) {
                dispatch(updateFavWallet(newFavWallet.id));
              }
            }}
          />
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      ) : chartType === 'Pie Chart' ? (
        <PieChart />
      ) : (
        <Trend />
      )}
    </div>
  );
};

export default Chart;
