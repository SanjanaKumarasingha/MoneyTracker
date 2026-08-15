import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import { BsWallet2 } from 'react-icons/bs';
import RecordModal from '../components/record/RecordModal';
import { useRecord } from '../provider/RecordDataProvider';
import { useAuth } from '../provider/AuthProvider';
import { profile } from '../apis';
import { IRecord, IRecordWithCategory, IUserInfo } from '../types';
import { fetchRecords } from '../apis/record';
import { GroupByScale } from '../common/group-scale.enum';
import { useAppDispatch } from '../hooks';
import { updateFavWallet } from '../store/walletSlice';
import { Card, EmptyState, SkeletonCard } from '../components/ui';
import HeroBalanceCard from '../components/home/HeroBalanceCard';
import SummaryCards from '../components/home/SummaryCards';
import WalletCard, { WALLET_CARD_WIDTH_CLASS } from '../components/wallet/WalletCard';
import TopSpendingCard from '../components/home/TopSpendingCard';
import RecentActivityCard from '../components/home/RecentActivityCard';

type Props = {};

const RECENT_RECORDS_LIMIT = 5;

function Home(props: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userId } = useAuth();

  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });

  const {
    wallets,
    favWallet,
    income,
    expense,
    groupByCategoryRecords,
    incomeByDate,
    expenseByDate,
    updateGroupingScale,
  } = useRecord();

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const { data: records = [], isLoading: isRecordsLoading } = useQuery<
    IRecordWithCategory[]
  >({
    queryKey: ['records', favWallet?.id],
    queryFn: () => fetchRecords(favWallet!.id),
    enabled: !!favWallet?.id,
  });

  useEffect(() => {
    updateGroupingScale(GroupByScale.MONTH);
  }, [groupByCategoryRecords]);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => {
        const dateDiff =
          DateTime.fromSQL(b.date).toMillis() -
          DateTime.fromSQL(a.date).toMillis();
        return dateDiff !== 0 ? dateDiff : b.id - a.id;
      })
      .slice(0, RECENT_RECORDS_LIMIT);
  }, [records]);

  const openAddRecord = () => setOpen(true);

  // `wallets` resolves to `undefined` while the initial query is in flight.
  const isWalletsLoading = !wallets;
  const hasNoWallets = !isWalletsLoading && wallets.length === 0;

  if (isWalletsLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-48" />
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
    <div className="select-none flex flex-col gap-4">
      <HeroBalanceCard
        username={user?.username}
        balance={income - expense}
        currency={favWallet?.currency}
        trendDelta={incomeByDate - expenseByDate}
        onClick={() => navigate('/records')}
      />

      <SummaryCards
        currency={favWallet?.currency}
        periodIncome={incomeByDate}
        periodExpense={expenseByDate}
        periodLabel={groupByCategoryRecords.date}
        onClick={() => navigate('/charts')}
      />

      {wallets.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">
            Your Wallets
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {wallets.map((wallet, index) => {
              const balance = (wallet.records ?? []).reduce((acc, cur) => {
                if (!cur.category) return acc;
                return cur.category.type === 'expense'
                  ? acc - Number(cur.price)
                  : acc + Number(cur.price);
              }, 0);

              return (
                <WalletCard
                  key={wallet.id}
                  name={wallet.name}
                  currency={wallet.currency}
                  balance={balance}
                  index={index}
                  className={`${WALLET_CARD_WIDTH_CLASS} shrink-0`}
                  onClick={() => {
                    dispatch(updateFavWallet(wallet.id));
                    navigate('/records');
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <TopSpendingCard
        periodLabel={groupByCategoryRecords.date}
        records={groupByCategoryRecords.records}
        currency={favWallet?.currency}
        onAddRecord={openAddRecord}
      />

      <RecentActivityCard
        records={recentRecords}
        currency={favWallet?.currency}
        isLoading={isRecordsLoading}
        onAddRecord={openAddRecord}
      />

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
