import { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { HiOutlineTrash } from 'react-icons/hi';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

import { IWallet } from '../types';
import WalletModal from '../components/wallet/WalletModal';
import { useRecord } from '../provider/RecordDataProvider';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import { useDarkMode } from '../provider/DarkModeProvider';

type WalletPageProps = {};

const WalletPage = (_prop: WalletPageProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [editWallet, setEditWallet] = useState<IWallet>({
    id: 0,
    name: '',
    currency: '',
  });

  const [type, setType] = useState<'Create' | 'Edit' | 'Delete'>('Create');

  const dispatch = useAppDispatch();
  const { wallets, favWallet } = useRecord();
  const { isDarkMode } = useDarkMode();

  const openCreate = () => {
    setType('Create');
    setEditWallet({ id: 0, name: '', currency: '' });
    setOpen(true);
  };

  const openEdit = (wallet: Pick<IWallet, 'id' | 'name' | 'currency'>) => {
    setType('Edit');
    setEditWallet((prev) => ({ ...prev, ...wallet }));
    setOpen(true);
  };

  const openDelete = (id: number) => {
    setType('Delete');
    setEditWallet((prev) => ({ ...prev, id }));
    setOpen(true);
  };

  return (
    <div className="dashboard-page">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className={clsx(
              'dashboard-kicker',
              isDarkMode ? 'text-white/40' : 'text-slate-500',
            )}
          >
            Wallets
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Manage your money spaces</h1>
          <p
            className={clsx(
              'mt-2 max-w-2xl text-sm sm:text-base',
              isDarkMode ? 'text-white/60' : 'text-slate-600',
            )}
          >
            Create separate wallets, see balances at a glance, and jump directly into
            category setup for each wallet.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={clsx(
            'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 py-3 transition-all',
            isDarkMode
              ? 'glass border border-emerald-400/20 text-emerald-100 hover:bg-white/10 active:bg-white/5'
              : 'border border-emerald-200 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',
          )}
        >
          <AiOutlinePlus className={clsx(isDarkMode ? 'text-emerald-200' : 'text-white')} />
          <span className="text-sm font-semibold">Add Wallet</span>
        </button>
      </div>

      <div className="dashboard-panel">
        {!wallets || wallets.length === 0 ? (
          <div>
            <p className="text-lg font-semibold">No wallets yet</p>
            <p
              className={clsx(
                'mt-2 text-sm',
                isDarkMode ? 'text-white/60' : 'text-slate-500',
              )}
            >
              Start with one wallet for your daily spending, then add more for savings,
              travel, or other goals.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {wallets.map(({ id, name, currency, records }) => {
              const balance =
                records?.reduce((acc, cur) => {
                  if (cur.category.type === 'expense') acc -= Number(cur.price);
                  else acc += Number(cur.price);
                  return acc;
                }, 0) ?? 0;

              const categorySummary = Object.entries(
                (records ?? []).reduce<Record<string, number>>((acc, record) => {
                  acc[record.category.name] = (acc[record.category.name] ?? 0) + 1;
                  return acc;
                }, {}),
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

              return (
                <div
                  key={id}
                  className={clsx(
                    'group relative cursor-pointer rounded-[28px] border p-4 transition-all sm:p-5',
                    favWallet?.id === id
                      ? isDarkMode
                        ? 'border-emerald-400/30 bg-emerald-400/10'
                        : 'border-emerald-200 bg-emerald-50/90'
                      : isDarkMode
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-slate-200 bg-white/80 hover:bg-white',
                  )}
                  onClick={() => {
                    dispatch(updateFavWallet(id));
                    navigate('/categories');
                  }}
                >
                  <div
                    className={clsx(
                      'pointer-events-none absolute bottom-2 right-3 select-none text-6xl font-bold',
                      isDarkMode ? 'text-white/5' : 'text-slate-200/60',
                    )}
                  >
                    {currency}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <p
                        className={clsx(
                          'dashboard-kicker',
                          isDarkMode ? 'text-white/40' : 'text-slate-500',
                        )}
                      >
                        Wallet
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">{name}</h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div
                          className={clsx(
                            'text-sm',
                            isDarkMode ? 'text-white/55' : 'text-slate-500',
                          )}
                        >
                          Balance
                        </div>
                        <div
                          className={clsx(
                            'mt-1 text-xl font-semibold',
                            isDarkMode ? 'text-emerald-100' : 'text-emerald-700',
                          )}
                        >
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: currency || 'USD',
                          }).format(balance)}
                        </div>
                      </div>

                      <div>
                        <div
                          className={clsx(
                            'text-sm',
                            isDarkMode ? 'text-white/55' : 'text-slate-500',
                          )}
                        >
                          Records
                        </div>
                        <div className="mt-1 text-xl font-semibold">
                          {records?.length ?? 0}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div
                        className={clsx(
                          'text-sm',
                          isDarkMode ? 'text-white/55' : 'text-slate-500',
                        )}
                      >
                        Top categories
                      </div>
                      {categorySummary.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {categorySummary.map(([categoryName, count]) => (
                            <span
                              key={categoryName}
                              className={clsx(
                                'rounded-full border px-3 py-1 text-xs',
                                isDarkMode
                                  ? 'border-white/10 bg-white/5 text-white/80'
                                  : 'border-slate-200 bg-slate-50 text-slate-600',
                              )}
                            >
                              {categoryName} ({count})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={clsx(
                            'mt-2 text-xs',
                            isDarkMode ? 'text-white/45' : 'text-slate-500',
                          )}
                        >
                          No categories used yet
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={clsx(
                          'rounded-xl border px-3 py-2 text-xs transition',
                          isDarkMode
                            ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit({ id, name, currency });
                        }}
                      >
                        Edit Wallet
                      </button>
                      <button
                        type="button"
                        className={clsx(
                          'rounded-xl border px-3 py-2 text-xs transition',
                          isDarkMode
                            ? 'border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20'
                            : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDelete(id);
                        }}
                        aria-label="Delete wallet"
                      >
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineTrash strokeWidth={1.5} />
                          Delete
                        </span>
                      </button>
                    </div>

                    <div
                      className={clsx(
                        'text-xs',
                        isDarkMode ? 'text-white/50' : 'text-slate-500',
                      )}
                    >
                      Tap the card to open this wallet&apos;s categories.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {open && (
          <WalletModal
            type={type}
            editWallet={editWallet}
            setOpen={setOpen}
            setEditWallet={setEditWallet}
          />
        )}
      </div>
    </div>
  );
};

export default WalletPage;
