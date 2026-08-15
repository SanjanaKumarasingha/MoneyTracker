import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { PiDotsSixVerticalBold, PiTrashLight } from 'react-icons/pi';
import IconSelector from '../IconSelector';
import CustomSwitch from '../Custom/CustomSwitch';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { updateCategory } from '../../apis/category';
import clsx from 'clsx';
import { ICategory } from '../../types';
import { useRef } from 'react';
import { Card } from '../ui';

type CategoryRowProps = {
  category: ICategory;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditCategory: React.Dispatch<React.SetStateAction<ICategory>>;
  onDelete?: (category: ICategory) => void;
  isDeleting?: boolean;
};

const CategoryRow = ({
  category,
  setOpen,
  setEditCategory,
  onDelete,
  isDeleting,
}: CategoryRowProps) => {
  const { id, name, icon, enable, type } = category;
  const enableRef = useRef<HTMLSpanElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    opacity: isDragging ? 0.8 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const queryClient = useQueryClient();

  // Update category mutation
  const updateCategoryMutation = useMutation<
    ICategory,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    ICategory
  >({
    mutationFn: updateCategory,
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
          ['categories'],
          typedContext.previousCategories,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    retry: 3,
  });

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        padding="sm"
        className="flex justify-between items-center cursor-pointer"
        onClick={(event) => {
          if (
            enableRef.current &&
            !enableRef.current.contains(event.target as Node)
          ) {
            setOpen(true);
            setEditCategory({ id, name, icon, enable, type });
          }
        }}
      >
        <div className="flex gap-2 items-center">
          <PiDotsSixVerticalBold className="text-base text-zinc-400 dark:text-zinc-500" />
          <div
            className={clsx(
              'flex items-center justify-center text-lg text-white rounded-full p-1.5',
              type === 'income' ? 'bg-success-500' : 'bg-danger-500',
            )}
          >
            <IconSelector name={icon} />
          </div>
          <p className="text-sm">{name}</p>
        </div>

        <div className="flex items-center gap-3">
          <span ref={enableRef}>
            <CustomSwitch
              on={enable}
              toggle={async () => {
                try {
                  await updateCategoryMutation.mutateAsync({
                    id,
                    icon,
                    name,
                    enable: !enable,
                    type,
                  });
                } catch (error) {}
              }}
              size={20}
              enableColor="peer-checked:bg-primary-300"
            />
          </span>

          {onDelete && (
            <button
              type="button"
              aria-label={`Delete ${name}`}
              className="text-lg text-zinc-400 hover:text-danger-500 disabled:opacity-50"
              disabled={isDeleting}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(category);
              }}
            >
              <PiTrashLight />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CategoryRow;
