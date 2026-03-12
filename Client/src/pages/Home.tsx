import { AiOutlinePlus } from 'react-icons/ai';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { useRecord } from '../provider/RecordDataProvider';
import { IRecord, IRecordWithCategory } from '../types';
import { useQuery } from '@tanstack/react-query';
import { fetchRecords } from '../apis/record';
import RecordModal from '../components/record/RecordModal';
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
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';

type Props = {};

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function Home(props: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isDarkMode } = useDarkMode();

  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });

  const { wallets, favWallet, groupByCategoryRecords, updateGroupingScale } =
    useRecord();

  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    favWallet?.id ? String(favWallet.id) : 'all',
  );

  useEffect(() => {
    setSelectedWalletId(favWallet?.id ? String(favWallet.id) : 'all');
  }, [favWallet]);

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
            color: isDarkMode
              ? 'rgba(255,255,255,0.75)'
              : 'rgba(0,0,0,0.70)',
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
          color: isDarkMode
            ? 'rgba(255,255,255,0.70)'
            : 'rgba(0,0,0,0.60)',
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
          data: Object.values(
            groupByCategoryRecords?.records?.expense ?? {},
          ).map((e) =>
            e.reduce((acc, cur) => acc + Number(cur.price), 0),
          ),
          backgroundColor: [
            'rgba(34, 197, 94, 0.60)',
            'rgba(45, 125, 255, 0.55)',
            'rgba(16, 185, 129, 0.55)',
            'rgba(59, 130, 246, 0.50)',
            'rgba(99, 102, 241, 0.45)',
            'rgba(244, 63, 94, 0.45)',
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
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className={clsx(
                'text-sm',
                isDarkMode ? 'text-white/60' : 'text-slate-600',
              )}
            >
              {favWallet
                ? `Wallet: ${favWallet.name}`
                : 'Select a wallet to view records'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedWalletId}
              onChange={(e) => {
                const selectedValue = e.target.value;

                if (selectedValue === 'add') {
                  navigate('/wallets');
                  return;
                }

                setSelectedWalletId(selectedValue);

                if (selectedValue === 'all') {
                  if (wallets?.length) {
                    dispatch(updateFavWallet(wallets[0].id));
                  }
                  return;
                }

                const selectedWallet = wallets?.find(
                  (wallet) => String(wallet.id) === selectedValue,
                );

                if (selectedWallet) {
                  dispatch(updateFavWallet(selectedWallet.id));
                }
              }}
              className={clsx(
                'rounded-xl border px-4 py-2 text-sm outline-none transition-colors',
                isDarkMode
                  ? 'bg-white/10 border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-800 shadow-sm',
              )}
            >
              <option value="all" className="text-black">
                All Wallets
              </option>

              {wallets?.map((wallet) => (
                <option
                  key={wallet.id}
                  value={wallet.id}
                  className="text-black"
                >
                  {wallet.name}
                </option>
              ))}

              <option
                value="add"
                className="text-green-600 font-semibold bg-gray-100"
              >
                + Add Wallet
              </option>
            </select>

            <button
              className={clsx(
                'rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50',
                isDarkMode
                  ? 'glass glow-green text-emerald-200 hover:bg-white/10'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
              )}
              disabled={!favWallet?.id}
              onClick={() => setOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <AiOutlinePlus /> Add Record
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div
            className={clsx(
              'col-span-12 rounded-2xl p-4 lg:col-span-6',
              isDarkMode
                ? 'glass glow-blue'
                : 'border border-slate-200 bg-white/70 shadow-md backdrop-blur-xl',
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p
                  className={clsx(
                    'text-sm',
                    isDarkMode ? 'text-white/70' : 'text-slate-700',
                  )}
                >
                  Distribution
                </p>
                <p
                  className={clsx(
                    'text-xs',
                    isDarkMode ? 'text-white/50' : 'text-slate-500',
                  )}
                >
                  {groupByCategoryRecords?.date
                    ? `of ${groupByCategoryRecords.date}`
                    : ''}
                </p>
              </div>

              <div
                className={clsx(
                  'rounded-xl px-2 py-1 text-xs',
                  isDarkMode
                    ? 'glass-strong text-white/70'
                    : 'bg-slate-100 text-slate-600',
                )}
              >
                Monthly
              </div>
            </div>

            {noRecords ? (
              <div
                className={clsx(
                  'rounded-xl border p-4 text-sm',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white/60'
                    : 'border-slate-200 bg-white/60 text-slate-500',
                )}
              >
                No record for {groupByCategoryRecords.date}
              </div>
            ) : (
              <div
                className={clsx(
                  'rounded-xl border p-3',
                  isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white/60',
                )}
              >
                <Doughnut options={options} data={data} />
              </div>
            )}
          </div>

          <div
            className={clsx(
              'col-span-12 rounded-2xl p-4 lg:col-span-6',
              isDarkMode
                ? 'glass glow-green'
                : 'border border-slate-200 bg-white/70 shadow-md backdrop-blur-xl',
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p
                  className={clsx(
                    'text-sm',
                    isDarkMode ? 'text-white/70' : 'text-slate-700',
                  )}
                >
                  Latest Records
                </p>
                <p
                  className={clsx(
                    'text-xs',
                    isDarkMode ? 'text-white/50' : 'text-slate-500',
                  )}
                >
                  Most recent transactions
                </p>
              </div>

              <button
                className={clsx(
                  'rounded-full p-2 transition',
                  isDarkMode
                    ? 'glass hover:bg-white/10 active:bg-white/5'
                    : 'border border-slate-200 bg-white hover:bg-slate-50',
                )}
                onClick={() => setOpen(true)}
                disabled={!favWallet?.id}
                title="Add new record"
              >
                <AiOutlinePlus />
              </button>
            </div>

            <div className="space-y-2">
              {records.length === 0 ? (
                <div
                  className={clsx(
                    'rounded-xl border p-4 text-sm',
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-white/60'
                      : 'border-slate-200 bg-white/60 text-slate-500',
                  )}
                >
                  No records yet.
                </div>
              ) : (
                records.slice(0, 6).map((record) => (
                  <div
                    key={record.id}
                    className={clsx(
                      'flex items-center justify-between rounded-xl border px-3 py-2 transition',
                      isDarkMode
                        ? 'border-white/10 bg-white/5 hover:bg-white/10'
                        : 'border-slate-200 bg-white/60 hover:bg-white',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'rounded-xl p-2 border',
                          isDarkMode
                            ? 'border-white/10'
                            : 'border-slate-200',
                          record.category.type === 'expense'
                            ? isDarkMode
                              ? 'bg-rose-400/15 text-rose-200'
                              : 'bg-rose-50 text-rose-500'
                            : isDarkMode
                            ? 'bg-emerald-400/15 text-emerald-200'
                            : 'bg-emerald-50 text-emerald-600',
                        )}
                      >
                        <IconSelector name={record.category.icon} />
                      </div>

                      <div className="leading-tight">
                        <div className="text-sm font-semibold">
                          {record.category.name}
                        </div>
                        <div
                          className={clsx(
                            'text-xs',
                            isDarkMode ? 'text-white/50' : 'text-slate-500',
                          )}
                        >
                          {record.date}
                        </div>
                      </div>
                    </div>

                    <div
                      className={clsx(
                        'text-sm font-semibold',
                        record.category.type === 'expense'
                          ? isDarkMode
                            ? 'text-rose-200'
                            : 'text-rose-500'
                          : isDarkMode
                          ? 'text-emerald-200'
                          : 'text-emerald-600',
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