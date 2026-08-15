import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import CustomModal from '../Custom/CustomModal';
import CustomSwitch from '../Custom/CustomSwitch';
import IconSelector from '../IconSelector';
import { fetchCategories, fetchHiddenCategoryIds, setCategoryVisibility } from '../../apis/category';
import { ICategory, IWallet } from '../../types';
import { ECategoryType } from '../../common/category-type';
import { Card, EmptyState, SkeletonCard } from '../ui';
import { PiTagThin } from 'react-icons/pi';

type WalletCategoryVisibilityModalProps = {
  wallet: IWallet;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const WalletCategoryVisibilityModal = ({
  wallet,
  setOpen,
}: WalletCategoryVisibilityModalProps) => {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<
    ICategory[]
  >({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const hiddenQueryKey = ['hidden-categories', wallet.id];

  const { data: hiddenIds = [], isLoading: isHiddenLoading } = useQuery<
    number[]
  >({
    queryKey: hiddenQueryKey,
    queryFn: () => fetchHiddenCategoryIds(wallet.id),
  });

  const isLoading = isCategoriesLoading || isHiddenLoading;

  const toggleVisibilityMutation = useMutation<
    { walletId: number; categoryId: number; hidden: boolean },
    AxiosError<{ error: string; message: string; statusCode: number }>,
    { categoryId: number; hidden: boolean },
    { previousHiddenIds?: number[] }
  >({
    mutationFn: ({ categoryId, hidden }) =>
      setCategoryVisibility({ walletId: wallet.id, categoryId, hidden }),
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
      toast(error.response?.data.message ?? 'Failed to update visibility', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: hiddenQueryKey });
    },
  });

  return (
    <CustomModal setOpen={setOpen} size="Medium">
      <div className="flex flex-col gap-2">
        <p className="text-2xl">Categories in “{wallet.name}”</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hide categories that don’t apply to this wallet. Categories stay
          shared across all your wallets — this only controls what shows up
          when adding a record here.
        </p>

        <div className="flex flex-col md:flex-row gap-3 mt-2">
          {Object.values(ECategoryType).map((type) => {
            if (isLoading) {
              return (
                <div key={type} className="flex-1 flex flex-col gap-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              );
            }

            const typeCategories = categories.filter((c) => c.type === type);

            return (
              <Card key={type} padding="md" className="flex-1">
                <h3 className="text-lg capitalize mb-2">{type}</h3>

                {typeCategories.length === 0 ? (
                  <EmptyState
                    icon={<PiTagThin />}
                    title={`No ${type} categories yet`}
                    description="Create categories from the Manage Categories page first."
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {typeCategories.map((category) => {
                      const hidden = hiddenIds.includes(category.id);

                      return (
                        <Card
                          key={category.id}
                          padding="sm"
                          className="flex justify-between items-center"
                        >
                          <div className="flex gap-2 items-center">
                            <div
                              className={`flex items-center justify-center text-lg text-white rounded-full p-1.5 ${
                                type === 'income'
                                  ? 'bg-success-500'
                                  : 'bg-danger-500'
                              }`}
                            >
                              <IconSelector name={category.icon} />
                            </div>
                            <p className="text-sm">{category.name}</p>
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
                            enableColor="peer-checked:bg-primary-300"
                          />
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </CustomModal>
  );
};

export default WalletCategoryVisibilityModal;
