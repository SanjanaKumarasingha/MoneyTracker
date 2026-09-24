import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import { BsWallet2 } from 'react-icons/bs';
import { AiOutlinePlus } from 'react-icons/ai';
import RecordModal from '../components/record/RecordModal';
import { useRecord } from '../provider/RecordDataProvider';
import { useAuth } from '../provider/AuthProvider';
import { profile } from '../apis';
import { IRecord, IUserInfo } from '../types';
import { EGoalType } from '../common/goal-type.enum';
import { EGoalPeriodType } from '../common/goal-period-type.enum';
import { useAppDispatch } from '../hooks';
import { useAllGoals } from '../hooks/useAllGoals';
import { updateFavWallet } from '../store/walletSlice';
import { Card, EmptyState, GlassFab, SkeletonCard } from '../components/ui';
import HeroBalanceCard from '../components/home/HeroBalanceCard';
import WalletCard from '../components/wallet/WalletCard';
import RecentActivityCard, { ActivityItem } from '../components/home/RecentActivityCard';
import SpendingBreakdownCard from '../components/home/SpendingBreakdownCard';
import { getWalletBudget } from '../utils/goalStatus';
import { getPeriodRange } from '../utils/period';
import {
  getBalancesByCurrency,
  getCashFlow,
  getNetWorthTrend,
  getPrimaryCurrency,
  getSpendingByCategory,
  getWalletBalance,
  getWalletTone,
} from '../utils/portfolio';

type Props = {};

const RECENT_RECORDS_LIMIT = 8;

const newRecordDraft = (): IRecord => ({
  id: 0,
  price: 0,
  remarks: '',
  date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
});

function Home(props: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userId } = useAuth();

  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord>(newRecordDraft);

  const { wallets, favWallet } = useRecord();
  const { goals } = useAllGoals();

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const monthRange = useMemo(() => getPeriodRange('month', 0), []);

  // Everything below is portfolio-wide (all wallets), in the primary
  // currency - see utils/portfolio.ts for why currencies are never mixed.
  const portfolio = useMemo(() => {
    const all = wallets ?? [];
    const currency = getPrimaryCurrency(all);
    const balances = getBalancesByCurrency(all);
    const now = DateTime.now();
    const monthlyLimits = goals.filter(
      (goal) =>
        goal.type === EGoalType.SPENDING_LIMIT &&
        goal.periodType === EGoalPeriodType.MONTHLY &&
        !goal.category &&
        goal.progress.isActive &&
        goal.wallet.currency === currency,
    );
    return {
      currency,
      otherBalances: balances.filter((entry) => entry.currency !== currency),
      trend: getNetWorthTrend(all, currency, 30),
      flow: getCashFlow(all, currency, monthRange),
      categories: getSpendingByCategory(all, currency, monthRange),
      pacing: monthlyLimits.length
        ? {
            spent: monthlyLimits.reduce((sum, goal) => sum + goal.progress.actual, 0),
            limit: monthlyLimits.reduce((sum, goal) => sum + Number(goal.targetAmount), 0),
          }
        : null,
      monthElapsed: now.day / now.daysInMonth,
    };
  }, [wallets, goals, monthRange]);

  const recentItems: ActivityItem[] = useMemo(
    () =>
      (wallets ?? [])
        .flatMap((wallet) =>
          (wallet.records ?? []).map((record) => ({
            record,
            walletName: wallet.name,
            currency: wallet.currency,
          })),
        )
        .sort((a, b) => {
          const dayDiff = b.record.date.slice(0, 10).localeCompare(a.record.date.slice(0, 10));
          return dayDiff !== 0 ? dayDiff : b.record.id - a.record.id;
        })
        .slice(0, RECENT_RECORDS_LIMIT),
    [wallets],
  );

  const openAddRecord = () => {
    setEditRecord(newRecordDraft());
    setOpen(true);
  };

  // `wallets` resolves to `undefined` while the initial query is in flight.
  const isWalletsLoading = !wallets;
  const hasNoWallets = !isWalletsLoading && wallets.length === 0;

  if (isWalletsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonCard className="h-52" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <SkeletonCard className="h-80 lg:col-span-3" />
          <SkeletonCard className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (hasNoWallets) {
    return (
      <Card>
        <EmptyState
          icon={<BsWallet2 />}
          title="Create your first wallet"
          description="You don't have any wallets yet. Create one to start tracking your income and expenses."
          actionLabel="Create a wallet"
          onAction={() => navigate('/wallets')}
        />
      </Card>
    );
  }

  return (
    <div className="select-none flex flex-col gap-6">
      <HeroBalanceCard
        username={user?.username}
        currency={portfolio.currency}
        trend={portfolio.trend}
        otherBalances={portfolio.otherBalances}
        monthIncome={portfolio.flow.income}
        monthExpense={portfolio.flow.expense}
        onClick={() => navigate('/wallets')}
      />

      <section aria-label="Wallets">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Your wallets</h2>
          <button
            type="button"
            onClick={() => navigate('/wallets')}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
          >
            Manage
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {wallets.map((wallet, index) => (
            <WalletCard
              key={wallet.id}
              name={wallet.name}
              currency={wallet.currency}
              balance={getWalletBalance(wallet)}
              tone={getWalletTone(wallet.name, index)}
              budget={getWalletBudget(goals, wallet.id)}
              onClick={() => {
                dispatch(updateFavWallet(wallet.id));
                navigate('/records');
              }}
            />
          ))}
        </div>
      </section>

      {/* 60 / 40: the feed is the primary reading surface, the breakdown is
          its at-a-glance companion. Stacks on tablet/phone. */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivityCard
            items={recentItems}
            showWalletTag={wallets.length > 1}
            isLoading={false}
            onAddRecord={openAddRecord}
          />
        </div>
        <div className="lg:col-span-2">
          <SpendingBreakdownCard
            monthLabel={monthRange?.label ?? ''}
            currency={portfolio.currency}
            categories={portfolio.categories}
            pacing={portfolio.pacing}
            monthElapsed={portfolio.monthElapsed}
          />
        </div>
      </div>

      {/* Page-level primary action, mirrors Mobile's Home - one glass FAB as
          the sole "Add record" entry point. bottom-20 on mobile clears the
          fixed BottomNavbar (~64px); sm: screens have no bottom nav. */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-30">
        <GlassFab
          variant="primary"
          size={56}
          icon={<AiOutlinePlus />}
          aria-label="Add record"
          title="Add record"
          onClick={openAddRecord}
        />
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
