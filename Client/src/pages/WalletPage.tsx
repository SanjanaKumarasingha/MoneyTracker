import { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { HiOutlineTrash } from 'react-icons/hi';

import { IWallet } from '../types';
import WalletModal from '../components/wallet/WalletModal';
import { useRecord } from '../provider/RecordDataProvider';

type WalletPageProps = {};

const WalletPage = (_prop: WalletPageProps) => {
  const [open, setOpen] = useState(false);

  const [editWallet, setEditWallet] = useState<IWallet>({
    id: 0,
    name: '',
    currency: '',
  });

  const [type, setType] = useState<'Create' | 'Edit' | 'Delete'>('Create');

  const { wallets } = useRecord();

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
    <div className="min-h-[calc(100vh-64px)] bg-[#06121f] text-white p-4">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[90px]" />
        <div className="absolute right-[-140px] top-[140px] h-[420px] w-[420px] rounded-full bg-emerald-400/15 blur-[100px]" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Wallets</h1>
            <p className="text-sm text-white/60">
              Manage your wallets and balances
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="glass rounded-xl px-3 py-2 flex items-center gap-2 border border-emerald-400/20 hover:bg-white/10 active:bg-white/5 transition-all"
          >
            <AiOutlinePlus className="text-emerald-200" />
            <span className="text-sm font-semibold text-emerald-100">
              Add Wallet
            </span>
          </button>
        </div>

        {/* Wallet cards */}
        <div className="glass rounded-2xl p-4 border border-white/10">
          {!wallets || wallets.length === 0 ? (
            <div className="text-white/70">
              No wallets yet. Click <span className="text-emerald-200 font-semibold">Add Wallet</span> to create one.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wallets.map(({ id, name, currency, records }) => {
                const balance =
                  records?.reduce((acc, cur) => {
                    if (cur.category.type === 'expense') acc -= Number(cur.price);
                    else acc += Number(cur.price);
                    return acc;
                  }, 0) ?? 0;

                return (
                  <div
                    key={id}
                    className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 hover:-translate-y-[1px] cursor-pointer"
                    onClick={() => openEdit({ id, name, currency })}
                  >
                    {/* currency watermark */}
                    <div className="pointer-events-none absolute right-3 bottom-2 text-6xl font-bold text-white/5 select-none">
                      {currency}
                    </div>

                    {/* delete button (stop click bubbling so it won't open edit) */}
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-xl p-2 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/5 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDelete(id);
                      }}
                      aria-label="Delete wallet"
                    >
                      <HiOutlineTrash strokeWidth={1.5} />
                    </button>

                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-white/60">Wallet</div>
                      <div className="text-lg font-semibold">{name}</div>

                      <div className="mt-2">
                        <div className="text-sm text-white/60">Balance</div>
                        <div className="text-xl font-semibold text-emerald-100">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: currency || 'USD',
                          }).format(balance)}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-white/50">
                        Click to edit • Trash to delete
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
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