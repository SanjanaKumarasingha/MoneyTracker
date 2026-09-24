import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { PiTagThin } from 'react-icons/pi';
import CustomSwitch from '../Custom/CustomSwitch';
import IconSelector from '../IconSelector';
import { fetchCategories, fetchHiddenCategoryIds, setCategoryVisibility } from '../../apis/category';
import { ICategory, IWallet } from '../../types';
import { ECategoryType } from '../../common/category-type';
import { getCategoryColor } from '../../utils/categoryColor';
import { Drawer, EmptyState, Skeleton } from '../ui';

type WalletCategoryDrawerProps = {
  /** The wallet whose category rules are being edited; null closes the drawer. */
  wallet: IWallet | null;
  onClose: () => void;
};

// Slide-over replacement for the old full-screen category-visibility modal.
// Each switch applies immediately (optimistic, rolled back on error), so
// there's no Save step - and the wallet cards stay visible behind the panel.
const WalletCategoryDrawer = ({ wallet, onClose }: WalletCategoryDrawerProps) => {
  const queryClient = useQueryClient();
  const walletId = wallet?.id ?? 0;

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: !!wallet,
  });

  const hiddenQueryKey = ['hidden-categories', walletId];

  const { data: hiddenIds = [], isLoading: isHiddenLoading } = useQuery<number[]>({
    queryKey: hiddenQueryKey,
    queryFn: () => fetchHiddenCategoryIds(walletId),
    enabled: !!wallet,
  });

  const isLoading = isCategoriesLoading || isHiddenLoading;

  const toggleVisibilityMutation = useMutation<
    { walletId: number; categoryId: number; hidden: boolean },
    AxiosError<{ error: string; message: string; statusCode: number }>,
    { categoryId: number; hidden: boolean },
    { previousHiddenIds?: number[] }
  >({
    mutationFn: ({ categoryId, hidden }) =>
      setCategoryVisibility({ walletId, categoryId, hidden }),
    onMutate: async ({ categoryId, hidden }) => {
      await queryClient.cancelQueries({ queryKey: hiddenQueryKey });
      const previousHiddenIds = queryClient.getQueryData<number[]>(hiddenQueryKey);
      queryClient.setQueryData<number[]>(hiddenQueryKey, (old = []) =>
        hidden ? [...old, categoryId] : old.filter((id) => id !== categoryId),
      );
      return { previousHiddenIds };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previousHiddenIds) {
        queryClient.setQueryData(hiddenQueryKey, ctx.previousHiddenIds);
      }
      toast(error.response?.data.message ?? 'Failed to update visibility', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: hiddenQueryKey });
    },
  });

  return (
    <Drawer
      isOpen={!!wallet}
      onClose={onClose}
      title={wallet ? `Category rules · ${wallet.name}` : ''}
      description="Switch off categories that don't apply to this wallet. Categories stay shared across all your wallets - this only controls what you can pick when adding a record here."
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.values(ECategoryType).map((type) => {
            const typeCategories = categories.filter((category) => category.type === type);
            const enabledCount = typeCategories.filter((c) => !hiddenIds.includes(c.id)).length;

            return (
              <section key={type} aria-label={`${type} categories`}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-200 capitalize">
                    {type}
                  </h3>
                  {typeCategories.length > 0 && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {enabledCount} of {typeCategories.length} on
                    </span>
                  )}
                </div>

                {typeCategories.length === 0 ? (
                  <EmptyState
                    icon={<PiTagThin />}
                    title={`No ${type} categories yet`}
                    description="Create categories from the Manage Categories page first."
                  />
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {typeCategories.map((category) => {
                      const hidden = hiddenIds.includes(category.id);
                      return (
                        <li
                          key={category.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.04] px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-white transition-opacity"
                              style={{
                                backgroundColor: getCategoryColor(category.id),
                                opacity: hidden ? 0.35 : 1,
                              }}
                            >
                              <IconSelector name={category.icon} />
                            </span>
                            <span
                              className={
                                'truncate text-sm font-medium ' +
                                (hidden
                                  ? 'text-zinc-400 dark:text-zinc-500 line-through'
                                  : 'text-zinc-800 dark:text-zinc-100')
                              }
                            >
                              {category.name}
                            </span>
                          </div>

                          <CustomSwitch
                            on={!hidden}
                            toggle={() =>
                              toggleVisibilityMutation.mutate({
                                categoryId: category.id,
                                hidden: !hidden,
                              })
                            }
                            size={20}
                            enableColor="peer-checked:bg-primary-500"
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default WalletCategoryDrawer;
