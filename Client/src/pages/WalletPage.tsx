import { useRef, useState } from 'react';

import { AiOutlinePlus } from 'react-icons/ai';
import { HiOutlineTrash } from 'react-icons/hi';
import { PiWalletThin } from 'react-icons/pi';

import { IWallet } from '../types';
import WalletModal from '../components/wallet/WalletModal';
import { useRecord } from '../provider/RecordDataProvider';
import { Button, Card, EmptyState, SkeletonCard } from '../components/ui';

type WalletPageProps = {};

const WalletPage = (prop: WalletPageProps) => {
  const [open, setOpen] = useState(false);

  const [editWallet, setEditWallet] = useState<IWallet>({
    id: 0,
    name: '',
    currency: '',
  });

  const [type, setType] = useState<'Create' | 'Edit' | 'Delete'>('Create');

  const trashRef = useRef<HTMLDivElement>(null);

  const { wallets } = useRecord();

  const isLoading = wallets === undefined;

  const openCreateModal = () => {
    setOpen(true);
    setType('Create');
    setEditWallet({ id: 0, name: '', currency: '' });
  };

  return (
    <div className="">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-2">
        <div className="flex justify-between items-center pb-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            List of Wallets
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="!rounded-full !p-1.5"
            aria-label="Create wallet"
            onClick={openCreateModal}
          >
            <AiOutlinePlus />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-flow-col overflow-x-auto grid-rows-2 py-2 gap-2 w-fit p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} className="w-[200px]" />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <EmptyState
            icon={<PiWalletThin />}
            title="No wallets yet"
            description="Create a wallet to start tracking your income and expenses."
            actionLabel="Create wallet"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-flow-col overflow-x-auto grid-rows-2 py-2 gap-2 w-fit p-2 transition-all duration-300">
            {wallets.map(({ id, name, currency, records }) => {
              const balance =
                records?.reduce((acc, cur) => {
                  if (cur.category.type === 'expense') {
                    acc -= Number(cur.price);
                  } else {
                    acc += Number(cur.price);
                  }
                  return acc;
                }, 0) ?? 0;

              return (
                <Card
                  key={id}
                  padding="sm"
                  className="relative flex flex-col gap-3 w-[200px] hover:scale-105 cursor-pointer transition-all duration-300"
                  onClick={(event) => {
                    if (
                      trashRef.current &&
                      !trashRef.current.contains(event.target as Node)
                    ) {
                      setOpen(true);
                      setType('Edit');
                      setEditWallet((prev) => {
                        return { ...prev, id, name, currency };
                      });
                    }
                  }}
                >
                  <div ref={trashRef} className="absolute right-1 top-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!rounded-full !p-1 !text-zinc-400 hover:!bg-zinc-200 hover:!bg-opacity-50 active:!bg-zinc-300 active:!bg-opacity-50"
                      aria-label="Delete wallet"
                      onClick={() => {
                        setOpen(true);
                        setType('Delete');
                        setEditWallet((prev) => {
                          return { ...prev, id };
                        });
                      }}
                    >
                      <HiOutlineTrash strokeWidth={1} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pr-6">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {name}
                    </span>
                    <span className="rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-bold px-2 py-0.5">
                      {currency}
                    </span>
                  </div>

                  <div
                    className={`text-lg font-bold ${
                      balance >= 0 ? 'text-success-600' : 'text-danger-600'
                    }`}
                  >
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency,
                    }).format(balance)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <WalletModal
          type={type}
          editWallet={editWallet}
          setOpen={setOpen}
          setEditWallet={setEditWallet}
        />
      )}
    </div>
  );
};
export default WalletPage;
