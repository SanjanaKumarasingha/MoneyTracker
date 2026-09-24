import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AiOutlinePlus } from 'react-icons/ai';
import { LuTarget } from 'react-icons/lu';
import { PiWalletThin } from 'react-icons/pi';

import { EGoalType } from '../common/goal-type.enum';
import GoalModal from '../components/goal/GoalModal';
import SavingGoalCard from '../components/goal/SavingGoalCard';
import BudgetRow from '../components/goal/BudgetRow';
import { Button, Card, EmptyState, ProgressBar, SkeletonCard } from '../components/ui';
import { useAllGoals } from '../hooks/useAllGoals';
import { useRecord } from '../provider/RecordDataProvider';
import { IGoalWithProgress } from '../types';
import { formatMoney } from '../utils';
import { getPrimaryCurrency } from '../utils/portfolio';
import { TONE_CLASSES, getBudgetTone, getScheduleStatus } from '../utils/goalStatus';

type Props = {};

const GoalsPage = (props: Props) => {
  const navigate = useNavigate();
  const { wallets } = useRecord();
  const { goals, isLoading: isGoalsLoading, isError, refetch } = useAllGoals();

  const [walletFilter, setWalletFilter] = useState<'all' | number>('all');
  const [modal, setModal] = useState<{
    open: boolean;
    goal: IGoalWithProgress | null;
    type?: EGoalType;
  }>({ open: false, goal: null });

  const visibleGoals = useMemo(
    () => goals.filter((goal) => walletFilter === 'all' || goal.wallet.id === walletFilter),
    [goals, walletFilter],
  );
  const savingGoals = visibleGoals.filter((goal) => goal.type === EGoalType.SAVING);
  const limitGoals = visibleGoals.filter((goal) => goal.type === EGoalType.SPENDING_LIMIT);

  // Goals live in whichever wallet they were made for, each with its own
  // currency, and there's no FX conversion anywhere in the app - so the
  // overview only totals the primary currency and says so, rather than
  // adding LKR to USD.
  const primaryCurrency = getPrimaryCurrency(wallets ?? []);
  const overview = useMemo(() => {
    const inPrimary = (goal: IGoalWithProgress) => goal.wallet.currency === primaryCurrency;
    const saving = savingGoals.filter(inPrimary);
    const limits = limitGoals.filter(inPrimary);
    return {
      savedActual: saving.reduce((sum, goal) => sum + goal.progress.actual, 0),
      savedTarget: saving.reduce((sum, goal) => sum + Number(goal.targetAmount), 0),
      spentActual: limits.reduce((sum, goal) => sum + goal.progress.actual, 0),
      spentTarget: limits.reduce((sum, goal) => sum + Number(goal.targetAmount), 0),
      overLimit: limitGoals.filter((goal) => goal.progress.status === 'exceeded').length,
      behind: savingGoals.filter((goal) => {
        const schedule = getScheduleStatus(goal);
        return schedule !== null && schedule.gapPercent > 5;
      }).length,
      hasOtherCurrency: [...savingGoals, ...limitGoals].some((goal) => !inPrimary(goal)),
    };
  }, [savingGoals, limitGoals, primaryCurrency]);

  const openCreate = (type?: EGoalType) => setModal({ open: true, goal: null, type });
  const openEdit = (goal: IGoalWithProgress) => setModal({ open: true, goal });
  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));

  if (!wallets || (isGoalsLoading && wallets.length > 0)) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonCard className="h-28" />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard className="h-44" />
          <SkeletonCard className="h-44" />
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<PiWalletThin />}
          title="Create a wallet first"
          description="Goals and spending limits belong to a wallet. Add one, then come back to set your first goal."
          actionLabel="Create a wallet"
          onAction={() => navigate('/wallets')}
        />
      </Card>
    );
  }

  const hasGoals = goals.length > 0;
  const budgetPercent =
    overview.spentTarget > 0 ? (overview.spentActual / overview.spentTarget) * 100 : 0;
  const savedPercent =
    overview.savedTarget > 0 ? (overview.savedActual / overview.savedTarget) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Goals & budgets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Save toward what matters, and cap what you spend.
          </p>
        </div>
        <Button onClick={() => openCreate()}>
          <AiOutlinePlus /> New goal
        </Button>
      </div>

      {wallets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by wallet">
          {[{ id: 'all' as const, name: 'All wallets' }, ...wallets].map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              role="tab"
              aria-selected={walletFilter === wallet.id}
              onClick={() => setWalletFilter(wallet.id)}
              className={clsx(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium cursor-pointer transition-colors',
                walletFilter === wallet.id
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
              )}
            >
              {wallet.name}
            </button>
          ))}
        </div>
      )}

      {isError ? (
        <Card>
          <EmptyState
            title="Couldn't load your goals"
            description="Something went wrong talking to the server."
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        </Card>
      ) : !hasGoals ? (
        <Card>
          <EmptyState
            icon={<LuTarget />}
            title="No goals yet"
            description="Set a saving goal to build toward something, or a spending limit to keep a category in check."
            actionLabel="Create your first goal"
            onAction={() => openCreate()}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Saved
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatMoney(overview.savedActual, primaryCurrency)}
                <span className="ml-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  / {formatMoney(overview.savedTarget, primaryCurrency)}
                </span>
              </p>
              <ProgressBar percent={savedPercent} barClassName="bg-warning-500" label="Saved overall" />
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Budgeted
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatMoney(overview.spentActual, primaryCurrency)}
                <span className="ml-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  / {formatMoney(overview.spentTarget, primaryCurrency)}
                </span>
              </p>
              <ProgressBar
                percent={budgetPercent}
                barClassName={TONE_CLASSES[getBudgetTone(budgetPercent)].bar}
                label="Budget used overall"
              />
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Needs attention
              </p>
              <p
                className={clsx(
                  'text-xl font-bold',
                  overview.overLimit + overview.behind > 0
                    ? TONE_CLASSES.danger.text
                    : TONE_CLASSES.success.text,
                )}
              >
                {overview.overLimit + overview.behind === 0
                  ? 'All on track'
                  : `${overview.overLimit + overview.behind} item${overview.overLimit + overview.behind === 1 ? '' : 's'}`}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {overview.overLimit} over limit · {overview.behind} behind schedule
              </p>
            </Card>
          </div>
          {overview.hasOtherCurrency && (
            <p className="-mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Totals above cover {primaryCurrency} goals only - other currencies aren't converted.
            </p>
          )}

          <section aria-labelledby="saving-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="saving-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Saving goals
              </h2>
              <Button variant="ghost" size="sm" onClick={() => openCreate(EGoalType.SAVING)}>
                <AiOutlinePlus /> Add
              </Button>
            </div>
            {savingGoals.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No saving goals yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savingGoals.map((goal) => (
                  <SavingGoalCard key={goal.id} goal={goal} onClick={() => openEdit(goal)} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="budget-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="budget-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Spending limits
              </h2>
              <Button variant="ghost" size="sm" onClick={() => openCreate(EGoalType.SPENDING_LIMIT)}>
                <AiOutlinePlus /> Add
              </Button>
            </div>
            {limitGoals.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No spending limits yet.</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {limitGoals.map((goal) => (
                  <BudgetRow key={goal.id} goal={goal} onClick={() => openEdit(goal)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <GoalModal
        isOpen={modal.open}
        onClose={closeModal}
        wallets={wallets}
        goal={modal.goal}
        defaultType={modal.type}
        defaultWalletId={typeof walletFilter === 'number' ? walletFilter : undefined}
      />
    </div>
  );
};

export default GoalsPage;
