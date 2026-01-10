import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCategory, fetchCategories, updateCategory } from '../apis/category';
import { ICategory, ICreateCategory, IUserInfo } from '../types';
import { profile, updateCategoryOrder } from '../apis';
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

type Props = {};

const CategoryPage = (props: Props) => {
  const queryClient = useQueryClient();

  const { userId } = useAuth();

  const [sortedCategories, setSortedCategories] = useState<ICategory[]>([]);

  const [activeCategory, setActiveCategory] = useState<ICategory | null>(null);

  const [open, setOpen] = useState<boolean>(false);

  const [editCategory, setEditCategory] = useState<ICategory>({
    id: 0,
    name: '',
    enable: true,
    type: ECategoryType.EXPENSE,
    icon: EIconName.MONEY,
  });

  const { data: categories } = useQuery<ICategory[]>(
    ['categories'],
    fetchCategories,
  );

  const { data: user } = useQuery<IUserInfo>(['user', userId], () =>
    profile(userId!),
  );

  // Update category order mutation
  const updateCategoryOrderMutation = useMutation<
    IUserInfo,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    { id: number; categoryOrder: number[] }
  >(updateCategoryOrder, {
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousUser: IUserInfo | undefined;
      };
      if (typedContext.previousUser) {
        queryClient.setQueryData<IUserInfo>(
          ['user'],
          typedContext.previousUser,
        );
      }
      toast('Failed to swap the category', { type: 'error' });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation<
    ICategory,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    Partial<ICreateCategory>
  >(addCategory, {
    onMutate: async ({ id, name, icon, type, enable }) => {
      // Optimistically update the cache

      queryClient.setQueryData<IUserInfo>(['user'], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            categoryOrder: [...oldData.categoryOrder, id],
          } as IUserInfo;
        }
        return oldData;
      });

      queryClient.setQueryData<ICategory[]>(['categories'], (oldData) => {
        if (oldData) {
          return [...oldData, { id, name, icon, type, enable } as ICategory];
        }
        return oldData;
      });

      return {
        previousCategories: queryClient.getQueryData<ICategory[]>([
          'categories',
        ]),
        previousUser: queryClient.getQueryData<IUserInfo>(['user']),
      };
    },
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousCategories: ICategory[] | undefined;
        previousUser: IUserInfo | undefined;
      };

      if (typedContext.previousCategories) {
        queryClient.setQueryData<ICategory[]>(
          ['catergoies'],
          typedContext.previousCategories,
        );
      }

      if (typedContext.previousUser) {
        queryClient.setQueryData<IUserInfo>(
          ['user'],
          typedContext.previousUser,
        );
      }
      toast(error.response?.data.message ?? 'Unexpected error from server', {
        type: 'error',
      });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries(['categories']);
      queryClient.invalidateQueries(['user']);
    },
    onSuccess(data, variables, context) {
      toast(`Category is created\nName: ${data.name}\nType:${data.type}`, {
        type: 'success',
      });
      setEditCategory({
        id: 0,
        name: '',
        type: data.type,
        enable: true,
        icon: EIconName.MONEY,
      });
    },
    retry: 3,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation<
    ICategory,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    ICategory
  >(updateCategory, {
    onMutate: async (newCategory) => {
      // Optimistically update the cache
      queryClient.setQueryData<ICategory[]>(['categories'], (oldData) => {
        if (oldData) {
          oldData.forEach((old) => {
            if (old.id === newCategory.id) {
              old.icon = newCategory.icon;
              old.name = newCategory.name;
              old.enable = newCategory.enable;
            }
          });
        }

        return oldData;
      });
      return {
        previousWallets: queryClient.getQueryData<ICategory[]>(['categories']),
      };
    },
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousCategories: ICategory[] | undefined;
      };

      if (typedContext.previousCategories) {
        queryClient.setQueryData<ICategory[]>(
          ['wallets'],
          typedContext.previousCategories,
        );
      }
      toast('Failed to enable the category', { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries(['wallets']);
    },
    onSuccess(data, variables, context) {
      toast('Category is updated!', { type: 'success' });
    },
    retry: 3,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (editCategory.id === 0) {
        // Create
        if (editCategory.name && editCategory.icon && editCategory.type) {
          await createCategoryMutation.mutateAsync(editCategory);
        }
      } else {
        // Update
        await updateCategoryMutation.mutateAsync(editCategory);
      }
    } catch (error) {}
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && user && active.id !== over.id) {
      try {
        const activeIndex = sortedCategories.findIndex(
          (item) => item.id === Number(active.id),
        );
        const overIndex = sortedCategories.findIndex(
          (item) => item.id === Number(over?.id),
        );
        const order = arrayMove(sortedCategories, activeIndex, overIndex);

        updateCategoryOrderMutation.mutateAsync({
          id: user.id,
          categoryOrder: order.map((item) => item.id),
        });
        setSortedCategories(order);
      } catch (error) {}
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const category = categories?.find((c) => c.id === event.active.id);
    if (category) {
      setActiveCategory(category);
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (categories && user) {
      setSortedCategories((prev) => {
        let sorted: ICategory[] = [];
        user.categoryOrder.forEach((id) => {
          const n = categories.filter((category) => category.id === Number(id));

          if (n.length > 0) {
            sorted.push(...n);
          }
        });

        return sorted;
      });
    }
  }, [categories, user]);

  return (
    <div>
      <div className="pb-3">
        <BackButton />
      </div>
      <div
        onClick={() => {
          toast('Category is updated!', { type: 'success' });
        }}
      >
        test
      </div>
      <div className="flex gap-2 md:flex-row flex-col">
        {Object.values(ECategoryType).map((cType) => (
          <DndContext
            key={cType}
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            autoScroll
          >
            <div className="p-3 flex flex-col gap-3 bg-info-100 dark:bg-info-700 rounded-md flex-1 h-full">
              <div className="flex justify-between items-center">
                <p className="text-lg">
                  {cType.charAt(0).toUpperCase() + cType.slice(1)}
                </p>

                <div
                  className=" flex gap-2 items-center p-1 rounded-md border border-dashed border-info-300 cursor-pointer hover:bg-primary-100 active:bg-primary-50 dark:hover:bg-opacity-40 dark:active:bg-opacity-70"
                  onClick={() => {
                    setEditCategory((prev) => {
                      return { ...prev, type: cType, name: '', id: 0 };
                    });
                    setOpen(true);
                  }}
                >
                  <div className="p-1">
                    <AiOutlinePlus />
                  </div>
                  <p className="px-2">Add New Category</p>
                </div>
              </div>

              <SortableContext
                items={sortedCategories}
                strategy={verticalListSortingStrategy}
              >
                {sortedCategories
                  .filter((sorted) => sorted.type === cType)
                  .map((category) => (
                    <div key={category.id}>
                      <CategoryRow
                        category={category}
                        setOpen={setOpen}
                        setEditCategory={setEditCategory}
                      />
                    </div>
                  ))}
              </SortableContext>
            </div>

            <DragOverlay>
              {activeCategory ? (
                <CategoryRow
                  category={activeCategory}
                  setOpen={setOpen}
                  setEditCategory={setEditCategory}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ))}
      </div>

      {open && (
        <CategoryModal
          setOpen={setOpen}
          callback={(event) => {
            handleSubmit(event);
          }}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
        />
      )}
    </div>
  );
};

export default CategoryPage;
