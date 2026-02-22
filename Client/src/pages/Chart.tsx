import { useState } from 'react';
import clsx from 'clsx';
import CustomSelector from '../components/Custom/CustomSelector';
import { useRecord } from '../provider/RecordDataProvider';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import PieChart from '../components/chart/PieChart';
import Trend from '../components/chart/Trend';

type Props = {};

const Chart = (props: Props) => {
  const [chartType, setChartType] = useState<'Pie Chart' | 'Trend'>('Pie Chart');

  const { wallets, favWallet } = useRecord();
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#06121f] text-white p-4">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[90px]" />
        <div className="absolute right-[-140px] top-[140px] h-[420px] w-[420px] rounded-full bg-emerald-400/15 blur-[100px]" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Charts</h1>
            <p className="text-sm text-white/60">
              {favWallet ? `Wallet: ${favWallet.name}` : 'Select a wallet to view charts'}
            </p>
          </div>

          <div className="w-full md:w-[320px] glass rounded-2xl p-2">
            <CustomSelector
              title={'Wallet:'}
              titlePosition="left"
              options={wallets?.map((w) => w.name) ?? []}
              value={favWallet?.name}
              callbackAction={(value) => {
                const newFavWallet = wallets?.find((w) => w.name === value);
                if (newFavWallet) dispatch(updateFavWallet(newFavWallet.id));
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="glass rounded-2xl p-2 inline-flex gap-2">
          <button
            type="button"
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              'hover:bg-white/10 active:bg-white/5',
              chartType === 'Pie Chart'
                ? 'bg-emerald-400/15 text-emerald-200 border border-emerald-400/20'
                : 'text-white/70 border border-white/10',
            )}
            onClick={() => setChartType('Pie Chart')}
          >
            Pie Chart
          </button>

          <button
            type="button"
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              'hover:bg-white/10 active:bg-white/5',
              chartType === 'Trend'
                ? 'bg-emerald-400/15 text-emerald-200 border border-emerald-400/20'
                : 'text-white/70 border border-white/10',
            )}
            onClick={() => setChartType('Trend')}
          >
            Trend
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 glass rounded-2xl p-4 border border-white/10">
          {chartType === 'Pie Chart' ? <PieChart /> : <Trend />}
        </div>
      </div>
    </div>
  );
};

export default Chart;