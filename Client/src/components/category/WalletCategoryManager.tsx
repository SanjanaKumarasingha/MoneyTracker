import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../../apis/category';
import {
  ICategory,
  ICreateCategory,
  IWalletRecordWithCategory,
} from '../../types';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import CategoryRow from './CategoryRow';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { AiOutlinePlus } from 'react-icons/ai';
import { ECategoryType } from '../../common/category-type';
import CategoryModal from './CategoryModal';
import { EIconName } from '../../common/icon-name.enum';
import { useAuth } from '../../provider/AuthProvider';
import { updateWalletCategoryOrder } from '../../apis/wallet';
import { useRecord } from '../../provider/RecordDataProvider';

type ApiError = {
  error: string;
  message: string | string[];
  statusCode: number;
};

type WalletCategoryManagerProps = {
  className?: string;
  title?: string;
  description?: string;
};

const WalletCategoryManager = ({
  className,
  title = 'Categories',
  description = 'Manage categories for the selected wallet',
}: WalletCategoryManagerProps) => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { favWallet } = useRecord();

  const [sortedCategories, setSortedCategories] = useState<ICategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<ICategory | null>(null);
  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ICategory>({
    id: 0,
    name: '',
    enable: true,
    type: ECategoryType.EXPENSE,
    icon: EIconName.MONEY,
  });

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories', favWallet?.id],
    queryFn: () => fetchCategories(favWallet!.id),
    enabled: !!favWallet?.id,
  });

  const updateCategoryOrderMutation = useMutation<
    unknown,
    AxiosError<ApiError>,
    { id: number; categoryOrder: number[] },
    { previousWallets?: IWalletRecordWithCategory[] }
  >({
    mutationFn: updateWalletCategoryOrder,
    onMutate: async ({ categoryOrder }) => {
      await queryClient.cancelQueries({ queryKey: ['wallets', userId] });

      const previousWallets = queryClient.getQueryData<IWalletRecordWithCategory[]>(
        ['wallets', userId],
      );

      if (previousWallets && favWallet) {
        queryClient.setQueryData(
          ['wallets', userId],
          previousWallets.map((wallet) =>
            wallet.id === favWallet.id ? { ...wallet, categoryOrder } : wallet,
          ),
        );
      }

      return { previousWallets };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousWallets) {
        queryClient.setQueryData(['wallets', userId], ctx.previousWallets);
      }
      toast('Failed to reorder categories', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    },
  });

  const createCategoryMutation = useMutation<
    ICategory,
    AxiosError<ApiError>,
    Partial<ICreateCategory>,
    { previousCategories?: ICategory[] }
  >({
    mutationFn: addCategory,
    onMutate: async (newCat) => {
      await queryClient.cancelQueries({ queryKey: ['categories', favWallet?.id] });

      const previousCategories =
        queryClient.getQueryData<ICategory[]>(['categories', favWallet?.id]);

      queryClient.setQueryData<ICategory[]>(
        ['categories', favWallet?.id],
        (old = []) => [...old, newCat as ICategory],
      );

      return { previousCategories };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousCategories) {
        queryClient.setQueryData(
          ['categories', favWallet?.id],
          ctx.previousCategories,
        );
      }

      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', favWallet?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    },
    onSuccess: (data) => {
      toast(`Category created: ${data.name}`, { type: 'success' });
      setEditCategory({
        id: 0,
        name: '',
        enable: true,
        type: data.type,
        icon: EIconName.MONEY,
      });
      setOpen(false);
    },
  });

  const updateCategoryMutation = useMutation<
    ICategory,
    AxiosError<ApiError>,
    ICategory,
    { previousCategories?: ICategory[] }
  >({
    mutationFn: updateCategory,
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['categories', favWallet?.id] });

      const previousCategories =
        queryClient.getQueryData<ICategory[]>(['categories', favWallet?.id]);

      queryClient.setQueryData<ICategory[]>(
        ['categories', favWallet?.id],
        (old = []) => old.map((c) => (c.id === updated.id ? updated : c)),
      );

      return { previousCategories };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousCategories) {
        queryClient.setQueryData(
          ['categories', favWallet?.id],
          ctx.previousCategories,
        );
      }
      toast('Failed to update category', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', favWallet?.id] });
    },
    onSuccess: () => {
      toast('Category updated', { type: 'success' });
      setOpen(false);
    },
  });

  const deleteCategoryMutation = useMutation<
    { id: number },
    AxiosError<ApiError>,
    number,
    { previousCategories?: ICategory[] }
  >({
    mutationFn: async (id) => {
      await deleteCategory(id);
      return { id };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories', favWallet?.id] });

      const previousCategories =
        queryClient.getQueryData<ICategory[]>(['categories', favWallet?.id]);

      queryClient.setQueryData<ICategory[]>(
        ['categories', favWallet?.id],
        (old = []) => old.filter((c) => c.id !== id),
      );

      return { previousCategories };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousCategories) {
        queryClient.setQueryData(
          ['categories', favWallet?.id],
          ctx.previousCategories,
        );
      }

      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Delete failed', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', favWallet?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    },
    onSuccess: () => {
      toast('Category deleted', { type: 'info' });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory.name?.trim()) return;
    if (!favWallet?.id) {
      toast('Select a wallet before managing categories', { type: 'warning' });
      return;
    }

    if (editCategory.id === 0) {
      await createCategoryMutation.mutateAsync({
        ...editCategory,
        walletId: favWallet.id,
      });
    } else {
      await updateCategoryMutation.mutateAsync(editCategory);
    }
  };

  const handleDelete = async (cat: ICategory) => {
    const ok = window.confirm(`Delete category "${cat.name}"?`);
    if (!ok) return;

    try {
      await deleteCategoryMutation.mutateAsync(cat.id);
    } catch {}
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || !favWallet || active.id === over.id) return;

    const activeIndex = sortedCategories.findIndex(
      (c) => c.id === Number(active.id),
    );
    const overIndex = sortedCategories.findIndex(
      (c) => c.id === Number(over.id),
    );

    const reordered = arrayMove(sortedCategories, activeIndex, overIndex);
    setSortedCategories(reordered);

    updateCategoryOrderMutation.mutate({
      id: favWallet.id,
      categoryOrder: reordered.map((c) => c.id),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const cat = categories.find((c) => c.id === event.active.id);
    if (cat) setActiveCategory(cat);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!categories.length) {
      setSortedCategories([]);
      return;
    }

    const ordered: ICategory[] = [];
    (favWallet?.categoryOrder ?? []).forEach((id) => {
      const found = categories.find((c) => c.id === id);
      if (found) ordered.push(found);
    });

    const leftovers = categories.filter(
      (c) => !ordered.some((o) => o.id === c.id),
    );

    setSortedCategories([...ordered, ...leftovers]);
  }, [categories, favWallet?.categoryOrder]);

  const categoriesByType = useMemo(() => {
    const map: Record<string, ICategory[]> = {};
    Object.values(ECategoryType).forEach((t) => (map[t] = []));
    sortedCategories.forEach((c) => map[c.type]?.push(c));
    return map;
  }, [sortedCategories]);

  if (!favWallet) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">{description}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {Object.values(ECategoryType).map((type) => (
          <DndContext
            key={type}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg capitalize text-white">{type}</h3>

                <button
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  onClick={() => {
                    setEditCategory({
                      id: 0,
                      name: '',
                      enable: true,
                      type,
                      icon: EIconName.MONEY,
                    });
                    setOpen(true);
                  }}
                  type="button"
                >
                  <AiOutlinePlus /> Add
                </button>
              </div>

              <SortableContext
                items={categoriesByType[type].map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categoriesByType[type].map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <CategoryRow
                          category={c}
                          setOpen={setOpen}
                          setEditCategory={setEditCategory}
                          walletId={favWallet.id}
                        />
                      </div>

                      <button
                        type="button"
                        className="rounded-md bg-zinc-200 px-2 py-1 text-xs hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditCategory(c);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="rounded-md bg-rose-300 px-2 py-1 text-xs text-white hover:bg-rose-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c);
                        }}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </div>

            <DragOverlay>
              {activeCategory && (
                <CategoryRow
                  category={activeCategory}
                  setOpen={setOpen}
                  setEditCategory={setEditCategory}
                  walletId={favWallet.id}
                />
              )}
            </DragOverlay>
          </DndContext>
        ))}
      </div>

      {open && (
        <CategoryModal
          setOpen={setOpen}
          callback={handleSubmit}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          walletId={favWallet.id}
        />
      )}
    </div>
  );
};

export default WalletCategoryManager;
