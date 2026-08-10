import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

import { AiOutlinePlus, AiOutlineCloudUpload, AiOutlineDownload } from 'react-icons/ai';
import { HiOutlineTrash } from 'react-icons/hi';
import { PiTagThin, PiWalletThin } from 'react-icons/pi';
import { BsArrowLeftRight } from 'react-icons/bs';

import { IWallet } from '../types';
import WalletModal from '../components/wallet/WalletModal';
import WalletCategoryVisibilityModal from '../components/wallet/WalletCategoryVisibilityModal';
import TransferModal from '../components/wallet/TransferModal';
import WalletCard, { WALLET_CARD_WIDTH_CLASS } from '../components/wallet/WalletCard';
import { useRecord } from '../provider/RecordDataProvider';
import { Button, EmptyState, SkeletonCard } from '../components/ui';
import { exportWalletToExcel } from '../utils/exportWallet';

type WalletPageProps = {};

const WalletPage = (prop: WalletPageProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [categoriesWallet, setCategoriesWallet] = useState<IWallet | null>(
    null,
  );

  const [editWallet, setEditWallet] = useState<IWallet>({
    id: 0,
    name: '',
    currency: '',
  });

  const [type, setType] = useState<'Create' | 'Edit' | 'Delete'>('Create');

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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="!rounded-full !p-1.5"
              aria-label="Import from spreadsheet"
              title="Import from spreadsheet"
              onClick={() => navigate('/import')}
            >
              <AiOutlineCloudUpload />
            </Button>
            {(wallets?.length ?? 0) >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="!rounded-full !p-1.5"
                aria-label="Transfer between wallets"
                title="Transfer between wallets"
                onClick={() => setOpenTransfer(true)}
              >
                <BsArrowLeftRight />
              </Button>
            )}
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
        </div>

        {isLoading ? (
          <div className="flex overflow-x-auto py-2 gap-3 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} className={clsx(WALLET_CARD_WIDTH_CLASS, 'shrink-0')} />
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
          // Plain single-row flex, not grid-flow-col/grid-rows-2 - the grid
          // version filled column-major (2 rows per column), so wallets
          // read as 0,2,4... on top and 1,3,5... on the bottom instead of
          // in order. This is the same flex carousel Home's wallet list
          // already uses.
          <div className="flex overflow-x-auto py-2 gap-3 p-2 transition-all duration-300">
            {wallets.map(({ id, name, currency, records }, index) => {
              const balance =
                records?.reduce((acc, cur) => {
                  // cur.category can be null for records whose category was
                  // later deleted (server soft-deletes categories) — skip
                  // them rather than crashing the whole wallet list.
                  if (!cur.category) return acc;
                  if (cur.category.type === 'expense') {
                    acc -= Number(cur.price);
                  } else {
                    acc += Number(cur.price);
                  }
                  return acc;
                }, 0) ?? 0;

              return (
                <WalletCard
                  key={id}
                  name={name}
                  currency={currency}
                  balance={balance}
                  index={index}
                  className={clsx(WALLET_CARD_WIDTH_CLASS, 'shrink-0')}
                  onClick={() => {
                    setOpen(true);
                    setType('Edit');
                    setEditWallet((prev) => ({ ...prev, id, name, currency }));
                  }}
                  actions={[
                    {
                      icon: <AiOutlineDownload />,
                      label: 'Download as Excel',
                      onClick: () =>
                        exportWalletToExcel({ id, name, currency, records: records ?? [] }),
                    },
                    {
                      icon: <PiTagThin />,
                      label: 'Manage categories for this wallet',
                      onClick: () => setCategoriesWallet({ id, name, currency }),
                    },
                    {
                      icon: <HiOutlineTrash strokeWidth={1} />,
                      label: 'Delete wallet',
                      onClick: () => {
                        setOpen(true);
                        setType('Delete');
                        setEditWallet((prev) => ({ ...prev, id }));
                      },
                    },
                  ]}
                />
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

      {openTransfer && <TransferModal setOpen={setOpenTransfer} />}

      {categoriesWallet && (
        <WalletCategoryVisibilityModal
          wallet={categoriesWallet}
          setOpen={(value) => {
            const isOpen =
              typeof value === 'function' ? value(true) : value;
            if (!isOpen) setCategoriesWallet(null);
          }}
        />
      )}
    </div>
  );
};
export default WalletPage;
