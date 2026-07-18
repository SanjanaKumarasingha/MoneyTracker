import React, { useEffect, useRef, useState } from 'react';
import CustomModal from '../Custom/CustomModal';
import {
  ICategory,
  ICreateRecord,
  IRecord,
  IUserInfo,
  IWallet,
  IWalletRecordWithCategory,
} from '../../types';
import Calculator from '../calculator/Calculator';
import { evaluate } from 'mathjs';
import CustomTextField from '../Custom/CustomTextField';
import {
  createRecord,
  deleteRecord,
  getRemarks,
  updateRecord,
} from '../../apis/record';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { fetchCategories } from '../../apis/category';
import { profile } from '../../apis';
import { useAppDispatch } from '../../hooks';
import { ECategoryType } from '../../common/category-type';
import clsx from 'clsx';
import CategorySelector from './CategorySelector';
import IconSelector from '../IconSelector';
import { DateTime } from 'luxon';
import DatePicker from 'react-datepicker';
import CustomSelector from '../Custom/CustomSelector';
import { updateFavWallet } from '../../store/walletSlice';
import { useRecord } from '../../provider/RecordDataProvider';
import { useAuth } from '../../provider/AuthProvider';

type RecordModalProps = {
  wallet: IWallet | undefined;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editRecord: IRecord;
  setEditRecord: React.Dispatch<React.SetStateAction<IRecord>>;
  recordCategory?: ICategory;
};

const RecordModal = ({
  wallet,
  setOpen,
  editRecord,
  setEditRecord,
  recordCategory,
}: RecordModalProps) => {
  const { userId } = useAuth();

  const [value, setValue] = useState<string>(
    editRecord.price === 0 ? '' : editRecord.price.toString(),
  );

  const [sortedCategories, setSortedCategories] = useState<ICategory[]>([]);

  const [categoryType, setCategoryType] = useState<ECategoryType>(
    ECategoryType.EXPENSE,
  );

  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    recordCategory ?? null,
  );

  const [openDelete, setOpenDelete] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const { data: categories } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const { data: remarks } = useQuery<string[]>({
    queryKey: ['remarks', selectedCategory?.id],
    queryFn: () => getRemarks(selectedCategory?.id!),
  });

  const { wallets } = useRecord();

  const datePickerRef = useRef<any>(null);
  const textInputRef = useRef<HTMLDivElement>(null);

  const updateCalc = (key: string) => {
    if (key === '=') {
      return setValue((prev) => {
        try {
          return evaluate(prev).toString();
        } catch (error) {
          return prev;
        }
      });
    }
    if (key === 'AC') {
      return setValue('');
    }

    if (key === 'DE') {
      try {
        return setValue((prev) => prev.slice(0, -1));
      } catch (error) {
        return setValue('Error');
      }
    }

    setValue((prev) => prev.concat(key));
  };

  // Create record mutation
  const createRecordMutation = useMutation<
    IRecord,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    ICreateRecord
  >({
    mutationFn: createRecord,
    onMutate: async ({ id, price, remarks, date }) => {
      // Optimistically update the cache

      queryClient.setQueryData<IWalletRecordWithCategory[]>(
        ['wallets'],
        (oldData) => {
          if (oldData) {
            const walletIndex = oldData.findIndex(
              (old) => old.id === wallet?.id,
            );

            if (walletIndex && selectedCategory) {
              const record = {
                id,
                price,
                remarks,
                date,
                category: selectedCategory,
              };
              oldData[walletIndex].records.unshift(record);
            }
          }

          return oldData;
        },
      );

      return {
        previousWallets: queryClient.getQueryData<IWalletRecordWithCategory[]>([
          'wallets',
        ]),
      };
    },
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousWallets: IWalletRecordWithCategory[] | undefined;
      };

      if (typedContext.previousWallets) {
        queryClient.setQueryData<IWalletRecordWithCategory[]>(
          ['wallets'],
          typedContext.previousWallets,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onSuccess(data, variables, context) {
      toast(`${variables.category.name} is added`, { type: 'success' });
      setEditRecord({
        id: 0,
        price: 0,
        remarks: '',
        date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
      });
      updateCalc('AC');
    },
    retry: 3,
  });

  // Update record mutation
  const updateRecordMutation = useMutation<
    IRecord,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    IRecord
  >({
    mutationFn: updateRecord,
    onMutate: async ({ id, price, remarks, date }) => {
      // Optimistically update the cache

      queryClient.setQueryData<IWalletRecordWithCategory[]>(
        ['wallets'],
        (oldData) => {
          if (oldData) {
            const walletIndex = oldData.findIndex((o) => o.id === wallet?.id);
            if (walletIndex) {
              const recordIndex = oldData[walletIndex].records.findIndex(
                (o) => o.id === id,
              );
              if (recordIndex) {
                oldData[walletIndex].records[recordIndex] = {
                  ...oldData[walletIndex].records[recordIndex],
                  price,
                  remarks,
                  date,
                };
              }
            }
          }
          return oldData;
        },
      );

      return {
        previousWallets: queryClient.getQueryData<IWalletRecordWithCategory[]>([
          'wallets',
        ]),
      };
    },
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousWallets: IWalletRecordWithCategory[] | undefined;
      };

      if (typedContext.previousWallets) {
        queryClient.setQueryData<IWalletRecordWithCategory[]>(
          ['wallets'],
          typedContext.previousWallets,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onSuccess(data, variables, context) {
      toast(`Record is updated`, { type: 'success' });
    },
    retry: 3,
  });

  const removeRecordMutation = useMutation<
    void,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    number
  >({
    mutationFn: deleteRecord,
    onError(error, variables, context) {},
    onMutate: async (variables) => {
      queryClient.setQueryData<IWalletRecordWithCategory[]>(
        ['wallets'],
        (oldData) => {
          if (oldData) {
            const walletIndex = oldData.findIndex((o) => o.id === wallet?.id);
            if (walletIndex) {
              oldData[walletIndex].records = oldData[
                walletIndex
              ].records.filter((r) => r.id !== variables);
            }
            console.log(oldData);
          }
          return oldData;
        },
      );
    },
    onSuccess(data, variables, context) {
      toast(`Record ID: ${editRecord.id} is delete`, { type: 'info' });
      setOpenDelete(false);
      setOpen(false);
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    type: 'Once' | 'Continue',
  ) => {
    event.preventDefault();

    try {
      if (!editRecord.price) {
        return toast('Please input the expense/income', { type: 'warning' });
      }

      if (!wallet) {
        return toast('There is no wallet is selected', { type: 'warning' });
      }

      if (!selectedCategory) {
        return toast('Please select the category', { type: 'warning' });
      }
      if (editRecord.id === 0) {
        await createRecordMutation.mutateAsync({
          ...editRecord,
          wallet: wallet,
          category: selectedCategory,
        });
      } else {
        await updateRecordMutation.mutateAsync({
          ...editRecord,
        });
      }

      if (type === 'Once') {
        setOpen(false);
      }
    } catch (error) {}
  };

  const dispatch = useAppDispatch();

  useEffect(() => {
    const keyListener = (event: KeyboardEvent) => {
      if (
        textInputRef.current?.contains(document.activeElement) ||
        datePickerRef.current.input.contains(document.activeElement)
      ) {
        return;
      }
      const reg = /\d|\/|\*|-|\+|\./g;

      if (event.key === 'Backspace') {
        return updateCalc('DE');
      }

      if (event.key === 'Enter') {
        return updateCalc('=');
      }

      if (reg.test(event.key)) {
        return updateCalc(event.key);
      }
    };

    window.addEventListener('keydown', keyListener);
    if (!isNaN(Number(value))) {
      setEditRecord((prev) => {
        return { ...prev, price: Number(value) };
      });
    }

    return () => {
      window.removeEventListener('keydown', keyListener);
    };
  }, [value]);

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
      <CustomModal setOpen={setOpen} size="Medium">
        <form className="w-full">
          <p className="text-2xl pb-2">
            {editRecord.id === 0 ? 'New' : 'Update'}{' '}
            {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}
          </p>
          <CategorySelector
            options={Object.values(ECategoryType)}
            value={categoryType}
            toggle={(type) => {
              setCategoryType(type as ECategoryType);
            }}
          />
          {/* Category */}
          <div
            className={clsx(
              'rounded-md my-2 w-full overflow-auto',
              categoryType === ECategoryType.EXPENSE
                ? 'bg-danger-50 dark:bg-danger-900 dark:bg-opacity-70'
                : 'bg-primary-50 dark:bg-primary-900',
            )}
          >
            <div
              className={clsx(
                'grid grid-flow-col overflow-x-auto grid-rows-3 w-fit gap-2 p-1',
              )}
            >
              {sortedCategories
                .filter((sorted) => sorted.type === categoryType)
                .map((category) => (
                  <div
                    className={clsx(
                      'rounded-md p-1 shadow cursor-pointer flex gap-2 items-center',
                      {
                        'bg-danger-400 text-danger-50 dark:bg-danger-700 shadow-danger-300 dark:shadow-danger-600 hover:bg-danger-300 active:bg-danger-400':
                          categoryType === ECategoryType.EXPENSE &&
                          selectedCategory?.id === category.id,
                      },

                      {
                        'bg-danger-100 text-danger-400 dark:bg-danger-400 dark:text-danger-100 shadow-danger-300 hover:bg-danger-200 active:bg-danger-100':
                          categoryType === ECategoryType.EXPENSE &&
                          selectedCategory?.id !== category.id,
                      },

                      {
                        'bg-primary-400 text-primary-50 dark:bg-primary-700 dark:shadow-primary-600 shadow-primary-300 hover:bg-primary-300 active:bg-primary-100':
                          categoryType === ECategoryType.INCOME &&
                          selectedCategory?.id === category.id,
                      },
                      {
                        'bg-primary-100 text-primary-400 dark:bg-primary-400 dark:text-primary-100 shadow-primary-300 hover:bg-primary-200 active:bg-primary-100':
                          categoryType === ECategoryType.INCOME &&
                          selectedCategory?.id !== category.id,
                      },
                    )}
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category);
                    }}
                  >
                    <IconSelector name={category.icon} />
                    <span>{category.name}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-between py-1 gap-1">
            {/* Wallet and date */}
            <div className="flex-1">
              <CustomSelector
                title={'Wallet:'}
                options={wallets?.map((w) => w.name) ?? []}
                value={wallet?.name}
                callbackAction={(value) => {
                  const newFavWallet = wallets?.find((w) => w.name === value);

                  if (newFavWallet) {
                    dispatch(updateFavWallet(newFavWallet.id));
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex gap-4 flex-wrap justify-between">
                Date:{' '}
                <div
                  className=" p-1 text-xs text-primary-400 rounded-md bg-transparent cursor-pointer hover:bg-primary-100 dark:bg-opacity-25"
                  onClick={() => {
                    setEditRecord((prev) => ({
                      ...prev,
                      date: DateTime.now().toFormat('yyyy-LL-dd'),
                    }));
                  }}
                >
                  Today?
                </div>
              </div>
              <DatePicker
                ref={datePickerRef}
                onChange={(e) => {
                  if (e) {
                    setEditRecord((prev) => {
                      return {
                        ...prev,
                        date:
                          DateTime.fromJSDate(e).toISO() ??
                          DateTime.fromJSDate(e).toFormat('yyyy-LL-dd'),
                      };
                    });
                  }
                }}
                selected={new Date(editRecord.date)}
                className=" outline-none border border-zinc-300 rounded-md p-2 bg-transparent"
              />
            </div>
          </div>
          <div className="relative bg-zinc-100 dark:bg-zinc-700 text-lg rounded-md p-1 text-right truncate overflow-auto mb-2">
            <span className="absolute left-1 text-zinc-600 dark:text-zinc-300 opacity-30 font-semibold">
              {wallet && wallet.currency}
            </span>

            <span>{value.length > 0 ? value : 0}</span>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-700 rounded-md p-2">
            {/* Calculator */}
            <Calculator
              callback={(key) => {
                updateCalc(key);
              }}
            />
          </div>
          <div className="py-2" ref={textInputRef}>
            <CustomTextField
              type={'text'}
              name="Remarks"
              value={editRecord.remarks}
              callbackAction={(event: React.ChangeEvent<HTMLInputElement>) => {
                setEditRecord((prev) => {
                  return {
                    ...prev,
                    remarks: event.target.value,
                  };
                });
              }}
            />
            <div className="text-sm pt-2 flex flex-wrap gap-2">
              {remarks?.map((remark) => (
                <span
                  className="bg-primary-100 rounded-lg p-1 cursor-pointer hover:bg-primary-200"
                  onClick={() => {
                    setEditRecord((prev) => {
                      return {
                        ...prev,
                        remarks: remark,
                      };
                    });
                  }}
                >
                  {remark}
                </span>
              ))}
            </div>
          </div>

          {/* Submit button and choose continue or close */}
          <div className="flex justify-end py-2 items-center gap-2">
            <button
              className="bg-primary-400 w-fit p-1 rounded-md text-white hover:bg-primary-300 cursor-pointer active:bg-primary-500 select-none"
              type="button"
              onClick={(e) => {
                if (editRecord.id === 0) {
                  handleSubmit(e, 'Continue');
                } else {
                  setOpenDelete(true);
                }
              }}
            >
              {editRecord.id === 0 ? 'Create and Continue' : 'Delete'}
            </button>

            <button
              className="bg-danger-400 w-fit p-1 rounded-md text-white hover:bg-danger-300 cursor-pointer active:bg-danger-500 select-none"
              type="button"
              onClick={(e) => {
                handleSubmit(e, 'Once');
              }}
            >
              {editRecord.id === 0 ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </CustomModal>

      {openDelete && (
        <CustomModal setOpen={setOpenDelete} size="Medium">
          <div>
            <span className="text-lg">Confirm to delete the record?</span>

            <div className="flex justify-end pt-2">
              <button
                className="bg-primary-400 w-fit p-1 rounded-md text-white hover:bg-primary-300 cursor-pointer active:bg-primary-500 select-none"
                onClick={async () => {
                  try {
                    await removeRecordMutation.mutateAsync(editRecord.id);
                  } catch (error) {}
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default RecordModal;
