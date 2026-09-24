import { useEffect, useState } from 'react';
import PieChart from '../components/chart/PieChart';
import { useRecord } from '../provider/RecordDataProvider';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import Trend from '../components/chart/Trend';
import { Card, SegmentedControl, Select, Skeleton } from '../components/ui';

type Props = {};

type ChartType = 'categories' | 'trend';

const ALL_WALLETS = 'All wallets';

const Chart = (props: Props) => {
  const [chartType, setChartType] = useState<ChartType>('categories');

  const {
    wallets,
    favWallet,
    allWalletsMode,
    setAllWalletsMode,
    excludedWalletCount,
  } = useRecord();

  // "All wallets" is Analytics-only state living in the shared provider, so
  // it must not leak into Records/Home when the user navigates away.
  useEffect(() => () => setAllWalletsMode(false), [setAllWalletsMode]);

  // Every other page skeletons while wallets are loading - this one used to
  // render PieChart/Trend against undefined/empty data with no indication
  // anything was still in flight.
  const isLoading = !wallets;

  const dispatch = useAppDispatch();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Analytics
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            See where your money goes, and how it moves over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label="Chart type"
            options={[
              { value: 'categories', label: 'Categories' },
              { value: 'trend', label: 'Trend' },
            ]}
            value={chartType}
            onChange={setChartType}
          />
          {/* ui/Select instead of the old CustomSelector - that component's
              dropdown panel had no dark-mode styling at all (hardcoded
              bg-white), so its options list was unreadable in dark mode. */}
          <Select
            className="w-48"
            options={[ALL_WALLETS, ...(wallets?.map((w) => w.name) ?? [])]}
            value={allWalletsMode ? ALL_WALLETS : (favWallet?.name ?? '')}
            placeholder="Select a wallet"
            onChange={(value) => {
              if (value === ALL_WALLETS) {
                setAllWalletsMode(true);
                return;
              }
              setAllWalletsMode(false);
              const newFavWallet = wallets?.find((w) => w.name === value);
              if (newFavWallet) {
                dispatch(updateFavWallet(newFavWallet.id));
              }
            }}
          />
        </div>
      </div>

      {allWalletsMode && excludedWalletCount > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing wallets in {favWallet?.currency} only. {excludedWalletCount} wallet
          {excludedWalletCount === 1 ? '' : 's'} in other currencies {excludedWalletCount === 1 ? 'is' : 'are'} left
          out - select {excludedWalletCount === 1 ? 'it' : 'one'} directly to see {excludedWalletCount === 1 ? 'it' : 'them'}.
        </p>
      )}

      {isLoading ? (
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      ) : chartType === 'categories' ? (
        <PieChart />
      ) : (
        <Trend />
      )}
    </div>
  );
};

export default Chart;
