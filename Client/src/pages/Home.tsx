import { AiOutlinePlus } from 'react-icons/ai';
import RecordModal from '../components/record/RecordModal';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
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

function Home(props: Props) {
  const { isDarkMode } = useDarkMode();

  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });

  const { favWallet, groupByCategoryRecords, updateGroupingScale } = useRecord();

  const { data: records = [] } = useQuery<IRecordWithCategory[]>({
    queryKey: ['records', favWallet?.id],
    queryFn: () => fetchRecords(favWallet!.id),
    enabled: !!favWallet?.id,
  });

  useEffect(() => {
    updateGroupingScale(GroupByScale.MONTH);
  }, [groupByCategoryRecords, updateGroupingScale]);

  const options: ChartOptions<'doughnut'> = useMemo(
    () => ({
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Barlow' },
            color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.70)',
            boxWidth: 10,
            boxHeight: 10,
          },
        },
        datalabels: {
          display: true,
          font: { size: 12, family: 'Barlow' },
          formatter: function (_value, context) {
            return (context.chart.data.labels as string[])[context.dataIndex];
          },
          anchor: 'end',
          align: 'start',
          color: isDarkMode ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)',
        },
      },
    }),
    [isDarkMode],
  );

  const data: ChartData<'doughnut'> = useMemo(
    () => ({
      labels: Object.keys(groupByCategoryRecords?.records?.expense ?? {}),
      datasets: [
        {
          label: 'Expenses',
          data: Object.values(groupByCategoryRecords?.records?.expense ?? {}).map((e) =>
            e.reduce((acc, cur) => acc + Number(cur.price), 0),
          ),
          // darker + neon-ish palette to match glass dark UI
          backgroundColor: [
            'rgba(34, 197, 94, 0.60)',  // green
            'rgba(45, 125, 255, 0.55)', // blue
            'rgba(16, 185, 129, 0.55)', // teal
            'rgba(59, 130, 246, 0.50)', // sky-blue
            'rgba(99, 102, 241, 0.45)', // indigo
            'rgba(244, 63, 94, 0.45)',  // rose
          ],
          borderColor: [
            'rgba(34, 197, 94, 0.95)',
            'rgba(45, 125, 255, 0.90)',
            'rgba(16, 185, 129, 0.90)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(99, 102, 241, 0.80)',
            'rgba(244, 63, 94, 0.80)',
          ],
          borderWidth: 1,
        },
      ],
    }),
    [groupByCategoryRecords],
  );

  const noRecords =
    Object.keys(groupByCategoryRecords.records?.expense ?? {}).length === 0 &&
    Object.keys(groupByCategoryRecords.records?.income ?? {}).length === 0;

  return (
    <div
      className={clsx(
        'min-h-[calc(100vh-64px)] transition-colors duration-500',
        isDarkMode
        ? 'bg-[#06121f] text-white'
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-800',
      )}
    >
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 transition-opacity duration-500">
        {isDarkMode ? (
          <>
            <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[90px]" />
            <div className="absolute right-[-140px] top-[140px] h-[420px] w-[420px] rounded-full bg-emerald-400/15 blur-[100px]" />
            <div className="absolute bottom-[-160px] left-[30%] h-[480px] w-[480px] rounded-full bg-cyan-400/10 blur-[110px]" />
          </>
        ) : (
          <>
            <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-300/40 blur-[100px]" />
            <div className="absolute right-[-140px] top-[140px] h-[420px] w-[420px] rounded-full bg-emerald-300/30 blur-[120px]" />
          </>
        )}
      </div>

      <div className="relative p-4 select-none">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Quick Access</h1>
            <p className="text-sm text-white/60">
              {favWallet ? `Wallet: ${favWallet.name}` : 'Select a wallet to view records'}
            </p>
          </div>

          <button
            className="glass glow-green rounded-xl px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-white/10 disabled:opacity-50"
            disabled={!favWallet?.id}
            onClick={() => setOpen(true)}
          >
            <span className="inline-flex items-center gap-2">
              <AiOutlinePlus /> Add Record
            </span>
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-12 gap-4">
          {/* Distribution */}
          <div className="col-span-12 lg:col-span-6 glass glow-blue rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Distribution</p>
                <p className="text-xs text-white/50">
                  {groupByCategoryRecords?.date ? `of ${groupByCategoryRecords.date}` : ''}
                </p>
              </div>

              <div className="glass-strong rounded-xl px-2 py-1 text-xs text-white/70">
                Monthly
              </div>
            </div>

            {noRecords ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No record for {groupByCategoryRecords.date}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <Doughnut options={options} data={data} />
              </div>
            )}
          </div>

          {/* Latest Records */}
          <div className="col-span-12 lg:col-span-6 glass glow-green rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Latest Records</p>
                <p className="text-xs text-white/50">Most recent transactions</p>
              </div>

              <button
                className="glass rounded-full p-2 hover:bg-white/10 active:bg-white/5"
                onClick={() => setOpen(true)}
                disabled={!favWallet?.id}
                title="Add new record"
              >
                <AiOutlinePlus />
              </button>
            </div>

            <div className="space-y-2">
              {records.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  No records yet.
                </div>
              ) : (
                records.slice(0, 6).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'rounded-xl p-2 border border-white/10',
                          record.category.type === 'expense'
                            ? 'bg-rose-400/15 text-rose-200'
                            : 'bg-emerald-400/15 text-emerald-200',
                        )}
                      >
                        <IconSelector name={record.category.icon} />
                      </div>

                      <div className="leading-tight">
                        <div className="text-sm font-semibold">{record.category.name}</div>
                        <div className="text-xs text-white/50">{record.date}</div>
                      </div>
                    </div>

                    <div
                      className={clsx(
                        'text-sm font-semibold',
                        record.category.type === 'expense'
                          ? 'text-rose-200'
                          : 'text-emerald-200',
                      )}
                    >
                      {favWallet?.currency} {record.price}
                    </div>
                  </div>
                ))
              )}
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
    </div>
  );
}

export default Home;