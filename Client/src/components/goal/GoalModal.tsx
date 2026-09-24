import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { DateTime } from 'luxon';

import { fetchCategories } from '../../apis/category';
import { createGoal, deleteGoal, updateGoal } from '../../apis/goal';
import { EGoalType } from '../../common/goal-type.enum';
import { EGoalPeriodType } from '../../common/goal-period-type.enum';
import { ALL_GOALS_KEY } from '../../hooks/useAllGoals';
import { useAuth } from '../../provider/AuthProvider';
import {
  ApiError,
  ICategory,
  ICreateGoal,
  IGoalWithProgress,
  IWalletRecordWithCategory,
} from '../../types';
import { getCategoryColor } from '../../utils/categoryColor';
import IconSelector from '../IconSelector';
import { Button, ConfirmDialog, Input, Modal, SegmentedControl, Select } from '../ui';

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: IWalletRecordWithCategory[];
  /** Pass a goal to edit it; omit/null to create. */
  goal?: IGoalWithProgress | null;
  defaultWalletId?: number;
  defaultType?: EGoalType;
}

const ISO = 'yyyy-LL-dd';

const TYPE_OPTIONS = [
  { value: EGoalType.SPENDING_LIMIT, label: 'Spending limit' },
  { value: EGoalType.SAVING, label: 'Saving goal' },
];

const PERIOD_OPTIONS = [
  { value: EGoalPeriodType.WEEKLY, label: 'Weekly' },
  { value: EGoalPeriodType.MONTHLY, label: 'Monthly' },
  { value: EGoalPeriodType.YEARLY, label: 'Yearly' },
  { value: EGoalPeriodType.CUSTOM, label: 'Custom' },
];

const SCOPE_OPTIONS: { value: 'wallet' | 'category'; label: string }[] = [
  { value: 'wallet', label: 'Whole wallet' },
  { value: 'category', label: 'One category' },
];

const walletLabel = (wallet: { name: string; currency: string }) =>
  `${wallet.name} · ${wallet.currency}`;

// Create/edit dialog for saving goals and spending limits. A goal targets a
// whole wallet or one category in it; the category picker is filtered to the
// side the server actually sums (SAVING sums INCOME records, SPENDING_LIMIT
// sums EXPENSE records), so a selected category can never mismatch.
// On edit, wallet/scope/type are read-only - the update endpoint doesn't
// accept them, and turning a saving goal into a limit is really a new goal.
const GoalModal = ({
  isOpen,
  onClose,
  wallets,
  goal,
  defaultWalletId,
  defaultType,
}: GoalModalProps) => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!goal;

  const [walletId, setWalletId] = useState<number | null>(null);
  const [type, setType] = useState<EGoalType>(EGoalType.SPENDING_LIMIT);
  const [periodType, setPeriodType] = useState<EGoalPeriodType>(EGoalPeriodType.MONTHLY);
  const [scope, setScope] = useState<'wallet' | 'category'>('wallet');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const today = DateTime.now();
    setWalletId(goal?.wallet.id ?? defaultWalletId ?? wallets[0]?.id ?? null);
    setType(goal?.type ?? defaultType ?? EGoalType.SPENDING_LIMIT);
    setPeriodType(goal?.periodType ?? EGoalPeriodType.MONTHLY);
    setScope(goal?.category ? 'category' : 'wallet');
    setCategoryId(goal?.category?.id ?? null);
    setName(goal?.name ?? '');
    setAmount(goal?.targetAmount ? String(Number(goal.targetAmount)) : '');
    setStartDate(goal?.startDate ? goal.startDate.slice(0, 10) : today.toFormat(ISO));
    setEndDate(goal?.endDate ? goal.endDate.slice(0, 10) : today.endOf('month').toFormat(ISO));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, goal, defaultWalletId, defaultType]);

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isOpen,
  });

  const relevantCategoryType = type === EGoalType.SAVING ? 'income' : 'expense';
  const categoryOptions = useMemo(
    () => categories.filter((category) => category.type === relevantCategoryType),
    [categories, relevantCategoryType],
  );

  // A type switch can leave the chosen category on the wrong side - drop it.
  useEffect(() => {
    if (categoryId && !categoryOptions.some((category) => category.id === categoryId)) {
      setCategoryId(null);
    }
  }, [categoryOptions, categoryId]);

  const onSettled = () => queryClient.invalidateQueries({ queryKey: [ALL_GOALS_KEY] });
  const onError = (fallback: string) => (error: AxiosError<ApiError>) => {
    const message = error.response?.data.message;
    toast(Array.isArray(message) ? message.join('\n') : message ?? fallback, { type: 'error' });
  };

  const createMutation = useMutation<unknown, AxiosError<ApiError>, Partial<ICreateGoal>>({
    mutationFn: createGoal,
    onSettled,
    onSuccess: onClose,
    onError: onError('Could not create goal. Please try again.'),
  });
  const updateMutation = useMutation<unknown, AxiosError<ApiError>, Parameters<typeof updateGoal>[0]>({
    mutationFn: updateGoal,
    onSettled,
    onSuccess: onClose,
    onError: onError('Could not update goal. Please try again.'),
  });
  const deleteMutation = useMutation<unknown, AxiosError<ApiError>, number>({
    mutationFn: deleteGoal,
    onSettled,
    onSuccess: () => {
      setConfirmDelete(false);
      onClose();
    },
    onError: onError('Could not delete goal. Please try again.'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);

  const handleSave = () => {
    const target = Number(amount);
    if (!amount || Number.isNaN(target) || target <= 0) {
      toast('Enter a target amount greater than 0.', { type: 'error' });
      return;
    }
    if (!isEditing && !walletId) {
      toast('Pick a wallet for this goal.', { type: 'error' });
      return;
    }
    if (!isEditing && scope === 'category' && !categoryId) {
      toast('Pick a category, or switch to "Whole wallet".', { type: 'error' });
      return;
    }
    if (periodType === EGoalPeriodType.CUSTOM && endDate <= startDate) {
      toast('The end date must be after the start date.', { type: 'error' });
      return;
    }

    const shared = {
      name: name.trim() || null,
      type,
      periodType,
      targetAmount: target,
      startDate,
      endDate: periodType === EGoalPeriodType.CUSTOM ? endDate : null,
    };

    if (goal) {
      updateMutation.mutate({ id: goal.id, ...shared });
    } else {
      createMutation.mutate({
        ...shared,
        userId: userId!,
        walletId: walletId!,
        categoryId: scope === 'category' && categoryId ? categoryId : undefined,
      });
    }
  };

  const fieldLabel = 'text-sm font-medium text-zinc-700 dark:text-zinc-200';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        title={isEditing ? 'Edit goal' : 'New goal'}
        footer={
          <>
            {isEditing && (
              <Button
                variant="ghost"
                className="!text-danger-600 dark:!text-danger-400 mr-auto"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isSaving} onClick={handleSave}>
              {isEditing ? 'Save changes' : 'Create goal'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="rounded-full bg-zinc-100 dark:bg-white/10 px-2.5 py-1 font-medium">
                {goal.type === EGoalType.SAVING ? 'Saving goal' : 'Spending limit'}
              </span>
              <span>{goal.wallet.name}</span>
              <span className="text-zinc-400">·</span>
              <span>{goal.category ? goal.category.name : 'Whole wallet'}</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className={fieldLabel}>What are you setting?</span>
                <SegmentedControl
                  fullWidth
                  aria-label="Goal type"
                  options={TYPE_OPTIONS}
                  value={type}
                  onChange={setType}
                />
              </div>

              <Select
                label="Wallet"
                options={wallets.map(walletLabel)}
                value={selectedWallet ? walletLabel(selectedWallet) : ''}
                placeholder="Select a wallet"
                onChange={(label) => {
                  const wallet = wallets.find((w) => walletLabel(w) === label);
                  if (wallet) setWalletId(wallet.id);
                }}
              />

              <div className="flex flex-col gap-1">
                <span className={fieldLabel}>Applies to</span>
                <SegmentedControl
                  fullWidth
                  aria-label="Goal scope"
                  options={SCOPE_OPTIONS}
                  value={scope}
                  onChange={setScope}
                />
              </div>

              {scope === 'category' && (
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => {
                    const selected = categoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryId(category.id)}
                        aria-pressed={selected}
                        className={clsx(
                          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors',
                          selected
                            ? 'border-transparent text-white'
                            : 'border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
                        )}
                        style={selected ? { backgroundColor: getCategoryColor(category.id) } : undefined}
                      >
                        <IconSelector name={category.icon} />
                        {category.name}
                      </button>
                    );
                  })}
                  {categoryOptions.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No {relevantCategoryType} categories yet.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <Input
            label="Name (optional)"
            placeholder={type === EGoalType.SAVING ? 'e.g. Japan trip' : 'e.g. Eating out'}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <Input
            label={`Target amount${selectedWallet ? ` (${selectedWallet.currency})` : ''}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />

          <div className="flex flex-col gap-1">
            <span className={fieldLabel}>Repeats</span>
            <SegmentedControl
              fullWidth
              aria-label="Goal period"
              options={PERIOD_OPTIONS}
              value={periodType}
              onChange={setPeriodType}
            />
          </div>

          {periodType === EGoalPeriodType.CUSTOM && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                label="End date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this goal?"
        message="This can't be undone. Your records are not affected."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => goal && deleteMutation.mutate(goal.id)}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};

export default GoalModal;
