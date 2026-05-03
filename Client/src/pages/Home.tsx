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
import {
  buildDoughnutData,
  buildDoughnutOptions,
} from '../components/chart/chartTheme';

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
    () => buildDoughnutOptions(isDarkMode ? 'dark' : 'light'),
    [isDarkMode],
  );

  const data: ChartData<'doughnut'> = useMemo(
    () =>
      buildDoughnutData(
        Object.keys(groupByCategoryRecords?.records?.expense ?? {}),
        Object.values(groupByCategoryRecords?.records?.expense ?? {}).map((e) =>
          e.reduce((acc, cur) => acc + Number(cur.price), 0),
        ),
        'Expenses',
      ),
    [groupByCategoryRecords],
  );

  const noRecords =
    Object.keys(groupByCategoryRecords.records?.expense ?? {}).length === 0 &&
    Object.keys(groupByCategoryRecords.records?.income ?? {}).length === 0;

  return (
    <div className="dashboard-page select-none">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            className={clsx(
              'dashboard-kicker',
              isDarkMode ? 'text-white/40' : 'text-slate-500',
            )}
          >
            Overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Daily money snapshot
          </h1>
          <p
            className={clsx(
              'mt-2 max-w-2xl text-sm sm:text-base',
              isDarkMode ? 'text-white/60' : 'text-slate-600',
            )}
          >
            Review the latest spending pattern, keep an eye on current wallet activity,
            and add a new record in one place.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              'min-h-[48px] rounded-2xl border px-4 py-3 text-sm outline-none transition-colors sm:min-w-[220px]',
              isDarkMode
                ? 'border-white/10 bg-white/10 text-white'
                : 'border-slate-200 bg-white text-slate-800 shadow-sm',
            )}
          >
            <option value="all" className="text-black">
              All Wallets
            </option>

            {wallets?.map((wallet) => (
              <option key={wallet.id} value={wallet.id} className="text-black">
                {wallet.name}
              </option>
            ))}

            <option value="add" className="bg-gray-100 font-semibold text-green-600">
              + Add Wallet
            </option>
          </select>

          <button
            className={clsx(
              'min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold transition',
              isDarkMode
                ? 'glass glow-green text-emerald-200 hover:bg-white/10'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
            )}
            onClick={() => {
              if (!favWallet?.id) {
                navigate('/wallets');
                return;
              }

              setOpen(true);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <AiOutlinePlus /> {favWallet?.id ? 'Add Record' : 'Create Wallet'}
            </span>
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="dashboard-panel">
          <div>
            <p
              className={clsx(
                'dashboard-kicker',
                isDarkMode ? 'text-white/60' : 'text-slate-600',
              )}
            >
              Active wallet
            </p>
            <p className="mt-2 text-lg font-semibold">
              {favWallet?.name ?? 'No wallet selected'}
            </p>
            <p
              className={clsx(
                'mt-1 text-sm',
                isDarkMode ? 'text-white/45' : 'text-slate-500',
              )}
            >
              {favWallet
                ? 'Use this wallet for charts and quick record creation.'
                : 'Create or choose a wallet to unlock the dashboard.'}
            </p>
          </div>
        </div>

        <div className="dashboard-panel">
          <p
            className={clsx(
              'dashboard-kicker',
              isDarkMode ? 'text-white/60' : 'text-slate-600',
            )}
          >
            Period
          </p>
          <p className="mt-2 text-lg font-semibold">
            {groupByCategoryRecords?.date ?? 'This month'}
          </p>
          <p
            className={clsx(
              'mt-1 text-sm',
              isDarkMode ? 'text-white/45' : 'text-slate-500',
            )}
          >
            Monthly grouping keeps the dashboard simple on smaller screens.
          </p>
        </div>

        <div className="dashboard-panel">
          <p
            className={clsx(
              'dashboard-kicker',
              isDarkMode ? 'text-white/60' : 'text-slate-600',
            )}
          >
            Latest activity
          </p>
          <p className="mt-2 text-lg font-semibold">
            {records[0]?.category.name ?? 'No recent records'}
          </p>
          <p
            className={clsx(
              'mt-1 text-sm',
              isDarkMode ? 'text-white/45' : 'text-slate-500',
            )}
          >
            {records[0]?.remarks || 'Recent transactions will appear here.'}
          </p>
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
          <div className="mb-3 flex items-center justify-between gap-3">
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
                {groupByCategoryRecords?.date ? `of ${groupByCategoryRecords.date}` : ''}
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

          {!favWallet ? (
            <div
              className={clsx(
                'rounded-xl border p-4 text-sm',
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-white/60'
                  : 'border-slate-200 bg-white/60 text-slate-500',
              )}
            >
              Create your first wallet to unlock dashboard charts.
            </div>
          ) : noRecords ? (
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
              onClick={() => {
                if (!favWallet?.id) {
                  navigate('/wallets');
                  return;
                }

                setOpen(true);
              }}
              title={favWallet?.id ? 'Add new record' : 'Create a wallet first'}
            >
              <AiOutlinePlus />
            </button>
          </div>

          <div className="space-y-2">
            {!favWallet ? (
              <div
                className={clsx(
                  'rounded-xl border p-4 text-sm',
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white/60'
                    : 'border-slate-200 bg-white/60 text-slate-500',
                )}
              >
                Start by creating a wallet, then add categories and records.
              </div>
            ) : records.length === 0 ? (
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
                    'flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition',
                    isDarkMode
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-slate-200 bg-white/60 hover:bg-white',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={clsx(
                        'rounded-xl border p-2',
                        isDarkMode ? 'border-white/10' : 'border-slate-200',
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

                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-sm font-semibold">
                        {record.category.name}
                      </div>
                      <div
                        className={clsx(
                          'truncate text-xs',
                          isDarkMode ? 'text-white/50' : 'text-slate-500',
                        )}
                      >
                        {record.date}
                      </div>
                    </div>
                  </div>

                  <div
                    className={clsx(
                      'shrink-0 text-sm font-semibold',
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
  );
}

export default Home;
