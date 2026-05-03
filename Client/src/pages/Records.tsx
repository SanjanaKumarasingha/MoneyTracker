import { useRef, useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { DateTime } from 'luxon';
import { IoSettingsOutline } from 'react-icons/io5';
import clsx from 'clsx';

import { ICategory, IRecord } from '../types';
import { useAppDispatch } from '../hooks';
import { useDarkMode } from '../provider/DarkModeProvider';
import { useRecord } from '../provider/RecordDataProvider';
import { updateFavWallet } from '../store/walletSlice';

import RecordModal from '../components/record/RecordModal';
import IconSelector from '../components/IconSelector';
import CustomAccordion from '../components/Custom/CustomAccordion';
import CustomModal from '../components/Custom/CustomModal';
import CustomSelector from '../components/Custom/CustomSelector';

type Props = {};

const Records = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [openSelectWallet, setOpenSelectWallet] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });

  const [editRecordCategory, setEditRecordCategory] =
    useState<ICategory | null>(null);

  const { wallets, favWallet, income, expense, total, dateRecords } =
    useRecord();
  const { isDarkMode } = useDarkMode();
  const dispatch = useAppDispatch();

  return (
    <div className="dashboard-page">
      {favWallet ? (
        <div className="dashboard-panel relative overflow-hidden">
          <div className="absolute right-[-32px] top-[-26px] h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p
                  className={clsx(
                    'dashboard-kicker',
                    isDarkMode ? 'text-white/40' : 'text-slate-500',
                  )}
                >
                  Current wallet
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{favWallet.name}</h2>
                <p
                  className={clsx(
                    'mt-1 text-sm',
                    isDarkMode ? 'text-white/60' : 'text-slate-500',
                  )}
                >
                  Review cash flow and drill into daily activity.
                </p>
              </div>

              <button
                type="button"
                className={clsx(
                  'dashboard-chip',
                  isDarkMode
                    ? 'text-white/75 hover:bg-white/10'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                )}
                onClick={() => {
                  setOpenSelectWallet(true);
                }}
              >
                <IoSettingsOutline strokeWidth={1.4} />
                Switch wallet
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div
                className={clsx(
                  'rounded-2xl border p-4',
                  isDarkMode
                    ? 'border-emerald-400/15 bg-emerald-400/10'
                    : 'border-emerald-100 bg-emerald-50',
                )}
              >
                <p className={clsx('text-sm', isDarkMode ? 'text-emerald-100/70' : 'text-emerald-700/80')}>
                  Income
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {favWallet.currency} {income.toFixed(2)}
                </p>
              </div>
              <div
                className={clsx(
                  'rounded-2xl border p-4',
                  isDarkMode
                    ? 'border-rose-400/15 bg-rose-400/10'
                    : 'border-rose-100 bg-rose-50',
                )}
              >
                <p className={clsx('text-sm', isDarkMode ? 'text-rose-100/70' : 'text-rose-700/80')}>
                  Expense
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {favWallet.currency} {expense.toFixed(2)}
                </p>
              </div>
              <div
                className={clsx(
                  'rounded-2xl border p-4',
                  isDarkMode
                    ? 'border-cyan-400/15 bg-cyan-400/10'
                    : 'border-cyan-100 bg-cyan-50',
                )}
              >
                <p className={clsx('text-sm', isDarkMode ? 'text-cyan-100/70' : 'text-cyan-700/80')}>
                  Balance
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {favWallet.currency} {total.toFixed(2)}
                </p>
              </div>
            </div>

            <div
              className={clsx(
                'absolute bottom-0 right-0 text-7xl font-semibold',
                isDarkMode ? 'text-white/5' : 'text-slate-200/80',
              )}
            >
              {favWallet.currency}
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-panel">
          Please create a wallet first to create records.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p
            className={clsx(
              'dashboard-kicker',
              isDarkMode ? 'text-white/40' : 'text-slate-500',
            )}
          >
            Timeline
          </p>
          <h3 className="mt-2 text-xl font-semibold">Daily records</h3>
        </div>

        <button
          type="button"
          className={clsx(
            'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
            isDarkMode
              ? 'border-emerald-300/20 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/20'
              : 'border-emerald-200 bg-emerald-500 text-white hover:bg-emerald-600',
          )}
          onClick={() => {
            setEditRecord((prev) => ({
              ...prev,
              id: 0,
              price: 0,
              remarks: '',
            }));
            setOpen(true);
          }}
        >
          <span className="inline-flex items-center gap-2">
            <AiOutlinePlus />
            Add record
          </span>
        </button>
      </div>

      {Object.keys(dateRecords).length > 0 ? (
        <div className="dashboard-panel mt-4">
          {dateRecords.map(({ date, records }, index) => (
            <div key={index} className="py-1">
              <CustomAccordion
                header={
                  <div
                    ref={headerRef}
                    className="accordion-header flex items-center justify-between rounded-2xl px-1 py-2"
                    onClick={() => {
                      setEditRecord((prev) => ({ ...prev, date }));
                    }}
                  >
                    <div>
                      <div className="font-medium">{date}</div>
                      <div
                        className={clsx(
                          'text-xs',
                          isDarkMode ? 'text-white/45' : 'text-slate-500',
                        )}
                      >
                        {records.length} transaction{records.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={clsx(
                          'text-xs uppercase tracking-[0.24em]',
                          isDarkMode ? 'text-white/35' : 'text-slate-400',
                        )}
                      >
                        Net
                      </div>
                      <div className="font-semibold">
                        {favWallet?.currency}{' '}
                        {records
                          .reduce((acc, cur) => {
                            const price =
                              cur.category.type === 'expense'
                                ? -Number(cur.price)
                                : Number(cur.price);
                            return acc + price;
                          }, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                  </div>
                }
                customClass={clsx(
                  'rounded-3xl border px-3 py-2',
                  isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white/80',
                )}
                triggerUpdate={favWallet}
                hideArrow
                controlled={{
                  expanded: selectedDate === date,
                  handleChange: (openValue: boolean) => {
                    if (openValue) {
                      setSelectedDate('');
                    } else {
                      setSelectedDate(date);
                    }
                  },
                }}
              >
                <div className="space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className={clsx(
                        'flex items-center justify-between rounded-2xl border px-3 py-3 cursor-pointer transition',
                        isDarkMode
                          ? 'border-white/10 bg-white/5 hover:bg-white/10'
                          : 'border-slate-200 bg-slate-50 hover:bg-white',
                        record.category.type === 'expense'
                          ? 'text-rose-300'
                          : 'text-emerald-300',
                      )}
                      onClick={() => {
                        setEditRecord(record);
                        setEditRecordCategory(record.category);
                        setOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'rounded-2xl border p-2',
                            isDarkMode
                              ? 'border-white/10 bg-white/10 text-white'
                              : 'border-slate-200 bg-white text-slate-700',
                          )}
                        >
                          <IconSelector name={record.category.icon} />
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span
                            className={clsx(
                              'truncate font-medium',
                              isDarkMode ? 'text-white' : 'text-slate-800',
                            )}
                          >
                            {record.category.name}
                          </span>
                          <span
                            className={clsx(
                              'truncate text-sm',
                              isDarkMode ? 'text-white/45' : 'text-slate-500',
                            )}
                          >
                            {record.remarks || 'No remarks'}
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 font-semibold">
                        {record.category.type === 'expense' && '-'}
                        {favWallet?.currency} {record.price}
                      </span>
                    </div>
                  ))}
                </div>
              </CustomAccordion>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-panel mt-4">No records</div>
      )}

      {open && (
        <RecordModal
          wallet={favWallet}
          setOpen={setOpen}
          editRecord={editRecord}
          setEditRecord={setEditRecord}
          recordCategory={editRecordCategory ?? undefined}
        />
      )}

      {openSelectWallet && (
        <CustomModal setOpen={setOpenSelectWallet}>
          <div className={clsx(isDarkMode ? 'text-white' : 'text-slate-900')}>
            <p className="text-2xl font-semibold">Select your wallet</p>

            <div className="py-3">
              <p className="font-semibold">Current wallet:</p>

              <div>Name: {favWallet?.name}</div>
              <div>Currency: {favWallet?.currency}</div>
            </div>
            <div>
              <CustomSelector
                title={'Wallet List'}
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
        </CustomModal>
      )}
    </div>
  );
};

export default Records;
