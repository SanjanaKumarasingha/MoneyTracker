import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AiOutlinePlus, AiOutlineCloudUpload, AiOutlineDownload } from 'react-icons/ai';
import { HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import { PiTagThin, PiWalletThin } from 'react-icons/pi';
import { BsArrowLeftRight } from 'react-icons/bs';
import { LuGauge } from 'react-icons/lu';

import { EGoalType } from '../common/goal-type.enum';
import { IGoalWithProgress, IWallet } from '../types';
import WalletModal from '../components/wallet/WalletModal';
import WalletCategoryDrawer from '../components/wallet/WalletCategoryDrawer';
import TransferModal from '../components/wallet/TransferModal';
import WalletCard from '../components/wallet/WalletCard';
import GoalModal from '../components/goal/GoalModal';
import { useRecord } from '../provider/RecordDataProvider';
import { useAllGoals } from '../hooks/useAllGoals';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import { Button, Card, EmptyState, Money, SkeletonCard } from '../components/ui';
import type { MoneyTone } from '../components/ui';
import { exportWalletToExcel } from '../utils/exportWallet';
import { formatMoney } from '../utils';
import { getWalletBudget } from '../utils/goalStatus';
import { getPeriodRange } from '../utils/period';
import {
  getCashFlow,
  getPrimaryCurrency,
  getWalletBalance,
  getWalletTone,
} from '../utils/portfolio';

type WalletPageProps = {};

const StatCard = ({
  label,
  amount,
  currency,
  prefix,
  tone,
  hint,
}: {
  label: string;
  amount: number;
  currency: string;
  prefix?: string;
  tone?: MoneyTone;
  hint?: string;
}) => (
  <Card className="flex flex-col gap-1">
    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {label}
    </p>
    <p>
      <Money amount={amount} currency={currency} prefix={prefix} tone={tone} className="text-2xl" />
    </p>
    {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
  </Card>
);

const WalletPage = (prop: WalletPageProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [openTransfer, setOpenTransfer] = useState<{ open: boolean; fromWalletId?: number }>({
    open: false,
  });
  const [categoriesWallet, setCategoriesWallet] = useState<IWallet | null>(null);
  const [goalModal, setGoalModal] = useState<{
    open: boolean;
    goal: IGoalWithProgress | null;
    walletId?: number;
  }>({ open: false, goal: null });

  const [editWallet, setEditWallet] = useState<IWallet>({
    id: 0,
    name: '',
    currency: '',
  });

  const [type, setType] = useState<'Create' | 'Edit' | 'Delete'>('Create');

  const { wallets } = useRecord();
  const { goals } = useAllGoals();

  const isLoading = wallets === undefined;

  const openCreateModal = () => {
    setOpen(true);
    setType('Create');
    setEditWallet({ id: 0, name: '', currency: '' });
  };

  const monthRange = useMemo(() => getPeriodRange('month', 0), []);
  const lastMonthRange = useMemo(() => getPeriodRange('month', -1), []);

  // Every stat is in ONE currency (the first wallet's) - there is no FX
  // conversion in the app, so summing an LKR wallet with a USD one would be
  // meaningless. Wallets in other currencies are called out below instead.
  const stats = useMemo(() => {
    const all = wallets ?? [];
    const currency = getPrimaryCurrency(all);
    const inCurrency = all.filter((wallet) => wallet.currency === currency);
    const balances = inCurrency.map(getWalletBalance);
    const flow = getCashFlow(all, currency, monthRange);
    const lastFlow = getCashFlow(all, currency, lastMonthRange);
    return {
      currency,
      assets: balances.filter((b) => b > 0).reduce((sum, b) => sum + b, 0),
      liabilities: Math.abs(balances.filter((b) => b < 0).reduce((sum, b) => sum + b, 0)),
      flow,
      flowChange: flow.net - lastFlow.net,
      otherCurrencyWallets: all.length - inCurrency.length,
    };
  }, [wallets, monthRange, lastMonthRange]);

  // "Edit limits": jump straight to the wallet's whole-wallet spending limit
  // if it has one, otherwise start a new one for this wallet. Per-category
  // limits are managed from the Goals page.
  const openLimits = (walletId: number) => {
    const existing = goals.find(
      (goal) =>
        goal.wallet.id === walletId &&
        goal.type === EGoalType.SPENDING_LIMIT &&
        !goal.category,
    );
    setGoalModal({ open: true, goal: existing ?? null, walletId });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Wallets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Balances, limits and rules for every account you track.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/import')}>
            <AiOutlineCloudUpload /> Import
          </Button>
          {(wallets?.length ?? 0) >= 2 && (
            <Button variant="outline" onClick={() => setOpenTransfer({ open: true })}>
              <BsArrowLeftRight /> Transfer
            </Button>
          )}
          <Button onClick={openCreateModal}>
            <AiOutlinePlus /> New wallet
          </Button>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} className="h-56" />
            ))}
          </div>
        </>
      ) : wallets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiWalletThin />}
            title="No wallets yet"
            description="Create a wallet to start tracking your income and expenses."
            actionLabel="Create wallet"
            onAction={openCreateModal}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total assets"
              amount={stats.assets}
              currency={stats.currency}
              hint="Wallets with a positive balance"
            />
            <StatCard
              label="Total liabilities"
              amount={stats.liabilities}
              currency={stats.currency}
              hint="Wallets that are overdrawn"
              tone={stats.liabilities > 0 ? 'negative' : 'default'}
            />
            <StatCard
              label="Net cash flow · this month"
              amount={stats.flow.net}
              currency={stats.currency}
              prefix={stats.flow.net >= 0 ? '+' : '−'}
              tone={stats.flow.net >= 0 ? 'positive' : 'negative'}
              hint={`${stats.flowChange >= 0 ? '▲' : '▼'} ${formatMoney(Math.abs(stats.flowChange), stats.currency)} vs last month`}
            />
          </div>
          {stats.otherCurrencyWallets > 0 && (
            <p className="-mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Totals cover {stats.currency} wallets only - {stats.otherCurrencyWallets} wallet
              {stats.otherCurrencyWallets === 1 ? '' : 's'} in other currencies aren't converted.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {wallets.map((wallet, index) => {
              const { id, name, currency, records } = wallet;
              const flow = getCashFlow([wallet], currency, monthRange);

              return (
                <WalletCard
                  key={id}
                  variant="rich"
                  name={name}
                  currency={currency}
                  balance={getWalletBalance(wallet)}
                  tone={getWalletTone(name, index)}
                  monthIncome={flow.income}
                  monthExpense={flow.expense}
                  budget={getWalletBudget(goals, id)}
                  onClick={() => {
                    dispatch(updateFavWallet(id));
                    navigate('/records');
                  }}
                  actions={[
                    {
                      icon: <HiOutlinePencil />,
                      label: 'Edit wallet',
                      onClick: () => {
                        setOpen(true);
                        setType('Edit');
                        setEditWallet((prev) => ({ ...prev, id, name, currency }));
                      },
                    },
                    {
                      icon: <AiOutlineDownload />,
                      label: 'Download as Excel',
                      onClick: () =>
                        exportWalletToExcel({ id, name, currency, records: records ?? [] }),
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
                  footerActions={[
                    ...(wallets.length >= 2
                      ? [
                          {
                            icon: <BsArrowLeftRight />,
                            label: 'Quick transfer',
                            onClick: () => setOpenTransfer({ open: true, fromWalletId: id }),
                          },
                        ]
                      : []),
                    {
                      icon: <LuGauge />,
                      label: 'Edit limits',
                      onClick: () => openLimits(id),
                    },
                    {
                      icon: <PiTagThin />,
                      label: 'Category rules',
                      onClick: () => setCategoriesWallet({ id, name, currency }),
                    },
                  ]}
                />
              );
            })}
          </div>
        </>
      )}

      {open && (
        <WalletModal
          type={type}
          editWallet={editWallet}
          setOpen={setOpen}
          setEditWallet={setEditWallet}
        />
      )}

      {openTransfer.open && (
        <TransferModal
          setOpen={(value) => setOpenTransfer({ open: value })}
          defaultFromWalletId={openTransfer.fromWalletId}
        />
      )}

      <WalletCategoryDrawer wallet={categoriesWallet} onClose={() => setCategoriesWallet(null)} />

      {wallets && (
        <GoalModal
          isOpen={goalModal.open}
          onClose={() => setGoalModal((prev) => ({ ...prev, open: false }))}
          wallets={wallets}
          goal={goalModal.goal}
          defaultWalletId={goalModal.walletId}
          defaultType={EGoalType.SPENDING_LIMIT}
        />
      )}
    </div>
  );
};
export default WalletPage;
