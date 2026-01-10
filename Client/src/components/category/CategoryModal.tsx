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

  const removeCategoryMutation = useMutation(deleteCategory, {
    onError(error, variables, context) {},
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
      queryClient.invalidateQueries(['categories', 'user']);
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
                      ? 'bg-rose-400'
                      : 'bg-info-400',
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

              <div
                className="text-2xl text-rose-400 p-2 hover:bg-rose-100 active:bg-rose-50 rounded-full cursor-pointer"
                onClick={() => {
                  setOpenDelete(true);
                }}
              >
                <PiTrashThin />
              </div>
            </div>
          )}

          <div>
            <p className="pb-1">Icons:</p>

            <div
              className={clsx(
                'flex flex-wrap gap-2 text-2xl',
                editCategory.type === ECategoryType.EXPENSE
                  ? 'text-rose-400'
                  : 'text-info-400',
              )}
            >
              {Object.values(EIconName).map((icon) => (
                <div
                  key={icon}
                  className={clsx(
                    'cursor-pointer rounded-md p-1',
                    {
                      'outline outline-1 bg-rose-50':
                        editCategory['icon'] === icon &&
                        editCategory.type === ECategoryType.EXPENSE,
                    },
                    {
                      'outline outline-1 bg-info-50':
                        editCategory['icon'] === icon &&
                        editCategory.type === ECategoryType.INCOME,
                    },
                    editCategory.type === ECategoryType.EXPENSE
                      ? 'hover:bg-rose-100 active:bg-rose-50'
                      : 'hover:bg-info-200 active:bg-info-100',
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
          <div className="flex justify-end">
            <button
              className="bg-info-400 w-fit p-1 rounded-md text-white hover:bg-info-300 cursor-pointer active:bg-info-500 select-none"
              type="submit"
            >
              {editCategory.id === 0 ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </CustomModal>

      {openDelete && (
        <CustomModal setOpen={setOpenDelete} size="Medium">
          <div>
            <span className="text-lg">Confirm to delete the category?</span>

            <div className="flex justify-end pt-2">
              <button
                className="bg-info-400 w-fit p-1 rounded-md text-white hover:bg-info-300 cursor-pointer active:bg-info-500 select-none"
                onClick={async () => {
                  try {
                    await removeCategoryMutation.mutateAsync(editCategory.id);
                  } catch (error) {}
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default CategoryModal;
