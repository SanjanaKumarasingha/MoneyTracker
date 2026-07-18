import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import { BsWallet2 } from 'react-icons/bs';
import RecordModal from '../components/record/RecordModal';
import { useRecord } from '../provider/RecordDataProvider';
import { useDarkMode } from '../provider/DarkModeProvider';
import { IRecord, IRecordWithCategory } from '../types';
import { fetchRecords } from '../apis/record';
import { GroupByScale } from '../common/group-scale.enum';
import { Card, EmptyState, SkeletonCard } from '../components/ui';
import SummaryCards from '../components/home/SummaryCards';
import ExpenseChartCard from '../components/home/ExpenseChartCard';
import RecentActivityCard from '../components/home/RecentActivityCard';

type Props = {};

const RECENT_RECORDS_LIMIT = 5;

function Home(props: Props) {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
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
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
        Dashboard
      </h1>

      <SummaryCards
        currency={favWallet?.currency}
        totalBalance={income - expense}
        periodIncome={incomeByDate}
        periodExpense={expenseByDate}
        periodLabel={groupByCategoryRecords.date}
      />

      <ExpenseChartCard
        periodLabel={groupByCategoryRecords.date}
        records={groupByCategoryRecords.records}
        isDarkMode={isDarkMode}
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
