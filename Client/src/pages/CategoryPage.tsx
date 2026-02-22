import { useEffect, useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCategory,
  fetchCategories,
  updateCategory,
  deleteCategory,
} from '../apis/category';
import { profile, updateCategoryOrder } from '../apis';
import { ICategory, ICreateCategory, IUserInfo } from '../types';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import CategoryRow from '../components/category/CategoryRow';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { AiOutlinePlus } from 'react-icons/ai';
import { ECategoryType } from '../common/category-type';
import CategoryModal from '../components/category/CategoryModal';
import { EIconName } from '../common/icon-name.enum';
import { useAuth } from '../provider/AuthProvider';

type ApiError = {
  error: string;
  message: string | string[];
  statusCode: number;
};

const CategoryPage = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

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

  /* ===================== QUERIES ===================== */

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  /* ===================== MUTATIONS ===================== */

  // 🔁 Update order
  const updateCategoryOrderMutation = useMutation<
    IUserInfo,
    AxiosError<ApiError>,
    { id: number; categoryOrder: number[] },
    { previousUser?: IUserInfo }
  >({
    mutationFn: updateCategoryOrder,
    onMutate: async ({ categoryOrder }) => {
      await queryClient.cancelQueries({ queryKey: ['user', userId] });

      const previousUser = queryClient.getQueryData<IUserInfo>(['user', userId]);

      if (previousUser) {
        queryClient.setQueryData<IUserInfo>(['user', userId], {
          ...previousUser,
          categoryOrder,
        });
      }

      return { previousUser };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousUser) {
        queryClient.setQueryData(['user', userId], ctx.previousUser);
      }
      toast('Failed to reorder categories', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  // ➕ Create
  const createCategoryMutation = useMutation<
    ICategory,
    AxiosError<ApiError>,
    Partial<ICreateCategory>,
    { previousCategories?: ICategory[]; previousUser?: IUserInfo }
  >({
    mutationFn: addCategory,
    onMutate: async (newCat) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      await queryClient.cancelQueries({ queryKey: ['user', userId] });

      const previousCategories =
        queryClient.getQueryData<ICategory[]>(['categories']);
      const previousUser = queryClient.getQueryData<IUserInfo>(['user', userId]);

      // optimistic: add category
      queryClient.setQueryData<ICategory[]>(['categories'], (old = []) => [
        ...old,
        newCat as ICategory,
      ]);

      // optimistic: append to order (only if we got an id from client-side; usually server sets id)
      if (previousUser && newCat.id != null) {
        queryClient.setQueryData<IUserInfo>(['user', userId], {
          ...previousUser,
          categoryOrder: [...previousUser.categoryOrder, newCat.id],
        });
      }

      return { previousCategories, previousUser };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousCategories) {
        queryClient.setQueryData(['categories'], ctx.previousCategories);
      }
      if (ctx?.previousUser) {
        queryClient.setQueryData(['user', userId], ctx.previousUser);
      }

      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
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

  // ✏️ Update
  const updateCategoryMutation = useMutation<
    ICategory,
    AxiosError<ApiError>,
    ICategory,
    { previousCategories?: ICategory[] }
  >({
    mutationFn: updateCategory,
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });

      const previousCategories =
        queryClient.getQueryData<ICategory[]>(['categories']);

      queryClient.setQueryData<ICategory[]>(['categories'], (old = []) =>
        old.map((c) => (c.id === updated.id ? updated : c)),
      );

      return { previousCategories };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousCategories) {
        queryClient.setQueryData(['categories'], ctx.previousCategories);
      }
      toast('Failed to update category', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onSuccess: () => {
      toast('Category updated', { type: 'success' });
      setOpen(false);
    },
  });

  // 🗑️ Delete
  const deleteCategoryMutation = useMutation<
    { id: number },
    AxiosError<ApiError>,
    number,
    { previousCategories?: ICategory[]; previousUser?: IUserInfo }
  >({
    mutationFn: async (id) => {
      await deleteCategory(id);
      return { id };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      await queryClient.cancelQueries({ queryKey: ['user', userId] });

      const previousCategories =
        queryClient.getQueryData<ICategory[]>(['categories']);
      const previousUser = queryClient.getQueryData<IUserInfo>(['user', userId]);

      // optimistic remove from categories
      queryClient.setQueryData<ICategory[]>(['categories'], (old = []) =>
        old.filter((c) => c.id !== id),
      );

      // optimistic remove from user categoryOrder
      if (previousUser) {
        queryClient.setQueryData<IUserInfo>(['user', userId], {
          ...previousUser,
          categoryOrder: previousUser.categoryOrder.filter((x) => x !== id),
        });
      }

      return { previousCategories, previousUser };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousCategories) {
        queryClient.setQueryData(['categories'], ctx.previousCategories);
      }
      if (ctx?.previousUser) {
        queryClient.setQueryData(['user', userId], ctx.previousUser);
      }

      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Delete failed', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onSuccess: () => {
      toast('Category deleted', { type: 'info' });
    },
  });

  /* ===================== HANDLERS ===================== */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory.name?.trim()) return;

    if (editCategory.id === 0) {
      await createCategoryMutation.mutateAsync(editCategory);
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
    if (!active || !over || !user || active.id === over.id) return;

    const activeIndex = sortedCategories.findIndex(
      (c) => c.id === Number(active.id),
    );
    const overIndex = sortedCategories.findIndex(
      (c) => c.id === Number(over.id),
    );

    const reordered = arrayMove(sortedCategories, activeIndex, overIndex);
    setSortedCategories(reordered);

    updateCategoryOrderMutation.mutate({
      id: user.id,
      categoryOrder: reordered.map((c) => c.id),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const cat = categories.find((c) => c.id === event.active.id);
    if (cat) setActiveCategory(cat);
  };

  /* ===================== DND ===================== */

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* ===================== ORDER BUILD ===================== */

  useEffect(() => {
    if (!categories.length || !user) return;

    const ordered: ICategory[] = [];
    user.categoryOrder.forEach((id) => {
      const found = categories.find((c) => c.id === id);
      if (found) ordered.push(found);
    });

    // add any categories not in order list (safe fallback)
    const leftovers = categories.filter(
      (c) => !ordered.some((o) => o.id === c.id),
    );

    setSortedCategories([...ordered, ...leftovers]);
  }, [categories, user]);

  /* ===================== UI HELPERS ===================== */

  const categoriesByType = useMemo(() => {
    const map: Record<string, ICategory[]> = {};
    Object.values(ECategoryType).forEach((t) => (map[t] = []));
    sortedCategories.forEach((c) => map[c.type]?.push(c));
    return map;
  }, [sortedCategories]);

  /* ===================== UI ===================== */

  return (
    <div>
      <BackButton />

      <div className="flex flex-col md:flex-row gap-3 mt-3">
        {Object.values(ECategoryType).map((type) => (
          <DndContext
            key={type}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <div className="flex-1 bg-info-100 dark:bg-info-700 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg capitalize">{type}</h3>

                <button
                  className="flex items-center gap-1 text-sm px-2 py-1 rounded-md hover:bg-white/40 dark:hover:bg-black/20"
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
                        />
                      </div>

                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500"
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
                        className="text-xs px-2 py-1 rounded-md bg-rose-300 hover:bg-rose-400 text-white"
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
        />
      )}
    </div>
  );
};

export default CategoryPage;