import clsx from 'clsx';
import React, { useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { EIconName } from '../../common/icon-name.enum';
import CustomModal from '../Custom/CustomModal';
import CustomTextField from '../Custom/CustomTextField';
import IconSelector from '../IconSelector';
import { ICategory, IUserInfo } from '../../types';
import { ECategoryType } from '../../common/category-type';
import { PiTrashThin } from 'react-icons/pi';
import { deleteCategory } from '../../apis/category';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Button, ConfirmDialog } from '../ui';

type CategoryModalProps = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editCategory: ICategory;
  setEditCategory: React.Dispatch<React.SetStateAction<ICategory>>;
  callback: (event: React.FormEvent<HTMLFormElement>) => void;
};

const CategoryModal = ({
  setOpen,
  callback,
  editCategory,
  setEditCategory,
}: CategoryModalProps) => {
  const queryClient = useQueryClient();

  const [edit, setEdit] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);

  const removeCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    // onMutate below already removed the category from the cache
    // optimistically — without this, a failed delete leaves it silently
    // missing from the list with no indication anything went wrong.
    onError() {
      toast('Failed to delete category. Please try again.', { type: 'error' });
    },
    onMutate: async (variables) => {
      queryClient.setQueryData<ICategory[]>(['categories'], (oldData) => {
        if (oldData) {
          return oldData.filter((prev) => prev.id !== variables);
        }
        return oldData;
      });

      queryClient.setQueryData<IUserInfo>(['user'], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            categoryOrder: oldData.categoryOrder.filter(
              (id) => id !== variables,
            ),
          } as IUserInfo;
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
    onSuccess(data, variables, context) {
      toast(`${editCategory.name} is delete`, { type: 'info' });
      setOpenDelete(false);
      setOpen(false);
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return (
    <div className="dark:text-white">
      <CustomModal setOpen={setOpen}>
        <form onSubmit={callback}>
          <div className="text-2xl">
            {editCategory.id === 0
              ? 'Add New Category for ' +
                editCategory.type.charAt(0).toUpperCase() +
                editCategory.type.slice(1)
              : 'Edit Category'}
          </div>
          {editCategory.id === 0 ? (
            <CustomTextField
              type={'text'}
              name={'Name'}
              value={editCategory['name']}
              callbackAction={(event) => {
                setEditCategory((prev) => {
                  return {
                    ...prev,
                    name: event.target.value,
                  };
                });
              }}
            />
          ) : (
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'text-4xl text-white rounded-full p-2 ',
                    editCategory.type === ECategoryType.EXPENSE
                      ? 'bg-danger-400'
                      : 'bg-success-400',
                  )}
                >
                  <IconSelector name={editCategory.icon}></IconSelector>
                </div>
                {!edit ? (
                  <span
                    onClick={() => {
                      setEdit(true);
                    }}
                  >
                    {editCategory.name}
                  </span>
                ) : (
                  <CustomTextField
                    type={'text'}
                    value={editCategory['name']}
                    callbackAction={(event) => {
                      setEditCategory((prev) => {
                        return {
                          ...prev,
                          name: event.target.value,
                        };
                      });
                    }}
                  />
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                className="!text-2xl !text-danger-500 !p-2 !rounded-full hover:!bg-danger-100 active:!bg-danger-50"
                aria-label="Delete category"
                onClick={() => {
                  setOpenDelete(true);
                }}
              >
                <PiTrashThin />
              </Button>
            </div>
          )}

          <div>
            <p className="pb-1">Icons:</p>

            <div
              className={clsx(
                'flex flex-wrap gap-2 text-2xl',
                editCategory.type === ECategoryType.EXPENSE
                  ? 'text-danger-400'
                  : 'text-success-400',
              )}
            >
              {Object.values(EIconName).map((icon) => (
                <div
                  key={icon}
                  className={clsx(
                    'cursor-pointer rounded-md p-1',
                    {
                      'outline outline-1 bg-danger-50':
                        editCategory['icon'] === icon &&
                        editCategory.type === ECategoryType.EXPENSE,
                    },
                    {
                      'outline outline-1 bg-success-50':
                        editCategory['icon'] === icon &&
                        editCategory.type === ECategoryType.INCOME,
                    },
                    editCategory.type === ECategoryType.EXPENSE
                      ? 'hover:bg-danger-100 active:bg-danger-50'
                      : 'hover:bg-success-200 active:bg-success-100',
                  )}
                  onClick={() => {
                    setEditCategory((prev) => {
                      return {
                        ...prev,
                        icon: icon,
                      };
                    });
                  }}
                >
                  <IconSelector name={icon} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editCategory.id === 0 ? 'Create' : 'Update'}
            </Button>
          </div>
        </form>
      </CustomModal>

      <ConfirmDialog
        isOpen={openDelete}
        title="Delete category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        isLoading={removeCategoryMutation.isPending}
        onCancel={() => setOpenDelete(false)}
        onConfirm={async () => {
          try {
            await removeCategoryMutation.mutateAsync(editCategory.id);
          } catch (error) {}
        }}
      />
    </div>
  );
};

export default CategoryModal;
