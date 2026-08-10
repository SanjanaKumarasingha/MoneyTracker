import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { DateTime } from 'luxon';
import { BsArrowLeftRight } from 'react-icons/bs';
import { Modal, Button, Input } from '../ui';
import { transferBetweenWallets } from '../../apis/transfer';
import { useRecord } from '../../provider/RecordDataProvider';
import { IWalletRecordWithCategory } from '../../types';
import { formatMoney } from '../home/utils';

type TransferModalProps = {
  setOpen: (open: boolean) => void;
  defaultFromWalletId?: number;
};

// Mirrors WalletPage.tsx's balance calc: sum this wallet's records,
// subtracting expense-shaped ones — transfer records count too, since
// their synthetic category correctly reflects which side moved the money.
const getBalance = (wallet: IWalletRecordWithCategory) =>
  (wallet.records ?? []).reduce((acc, cur) => {
    if (!cur.category) return acc;
    return cur.category.type === 'expense'
      ? acc - Number(cur.price)
      : acc + Number(cur.price);
  }, 0);

// One big card per wallet, swipeable horizontally — mirrors a bank app's
// "Account Transfer" picker (name + currency chip up top, a divider, then
// the balance) rather than a plain dropdown, so both sides of the transfer
// stay glanceable while picking.
const WalletOption = ({
  wallet,
  selected,
  onClick,
}: {
  wallet: IWalletRecordWithCategory;
  selected: boolean;
  onClick: () => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') onClick();
    }}
    className={clsx(
      'snap-start shrink-0 w-[75%] sm:w-60 rounded-2xl p-4 flex flex-col gap-3 border cursor-pointer transition-colors',
      selected
        ? 'bg-primary-600 border-primary-600 text-white'
        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700',
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="font-bold truncate">{wallet.name}</span>
      <span
        className={clsx(
          'shrink-0 text-xs font-bold px-2 py-0.5 rounded-full',
          selected
            ? 'bg-white/20 text-white'
            : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
        )}
      >
        {wallet.currency}
      </span>
    </div>

    <div className={clsx('border-t', selected ? 'border-white/25' : 'border-zinc-200 dark:border-zinc-700')} />

    <div>
      <div
        className={clsx(
          'text-[10px] font-semibold uppercase tracking-wide',
          selected ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        Available balance
      </div>
      <div className="text-lg font-bold mt-0.5">
        {formatMoney(getBalance(wallet), wallet.currency)}
      </div>
    </div>
  </div>
);

const TransferModal = ({ setOpen, defaultFromWalletId }: TransferModalProps) => {
  const { wallets = [] } = useRecord();
  const queryClient = useQueryClient();

  const [fromWalletId, setFromWalletId] = useState<number | null>(
    defaultFromWalletId ?? wallets[0]?.id ?? null,
  );
  const [toWalletId, setToWalletId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const toOptions = useMemo(
    () => wallets.filter((w) => w.id !== fromWalletId),
    [wallets, fromWalletId],
  );

  const transferMutation = useMutation<
    unknown,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    { fromWalletId: number; toWalletId: number; amount: number; date: string; remarks?: string }
  >({
    mutationFn: transferBetweenWallets,
    onSuccess: () => {
      toast(
        `Transferred ${formatMoney(Number(amount), fromWallet?.currency)} from ${fromWallet?.name} to ${toWallet?.name}`,
        { type: 'success' },
      );
      // Both wallets' balances/record lists changed — the shorthand key
      // (without userId) matches the same convention WalletModal/RecordModal
      // already use; react-query's default prefix matching invalidates the
      // real ['wallets', userId] query too.
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setOpen(false);
    },
    onError: (error) => {
      toast(error.response?.data.message ?? 'Transfer failed', {
        type: 'error',
      });
    },
  });

  const amountNumber = Number(amount);
  const canSubmit =
    fromWalletId != null &&
    toWalletId != null &&
    fromWalletId !== toWalletId &&
    amountNumber > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || fromWalletId == null || toWalletId == null) return;

    transferMutation.mutate({
      fromWalletId,
      toWalletId,
      amount: amountNumber,
      date: DateTime.now().toISODate() ?? DateTime.now().toFormat('yyyy-LL-dd'),
      remarks: remarks.trim() || undefined,
    });
  };

  if (wallets.length < 2) {
    return (
      <Modal isOpen onClose={() => setOpen(false)} title="Transfer between wallets" size="sm">
        <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
          You need at least two wallets to transfer money between them.
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={() => setOpen(false)}
      title={
        <span className="flex items-center gap-2">
          <BsArrowLeftRight /> Transfer between wallets
        </span>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
            Transfer From
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
            {wallets.map((wallet) => (
              <WalletOption
                key={wallet.id}
                wallet={wallet}
                selected={fromWalletId === wallet.id}
                onClick={() => {
                  setFromWalletId(wallet.id);
                  if (toWalletId === wallet.id) setToWalletId(null);
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
            Transfer To
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
            {toOptions.map((wallet) => (
              <WalletOption
                key={wallet.id}
                wallet={wallet}
                selected={toWalletId === wallet.id}
                onClick={() => setToWalletId(wallet.id)}
              />
            ))}
          </div>
        </div>

        <Input
          label={`Amount${fromWallet ? ` (${fromWallet.currency})` : ''}`}
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />

        <Input
          label="Remarks (optional)"
          placeholder={
            fromWallet && toWallet
              ? `Transfer from ${fromWallet.name} to ${toWallet.name}`
              : undefined
          }
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            isLoading={transferMutation.isPending}
          >
            Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferModal;
