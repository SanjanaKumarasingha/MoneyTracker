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

type ApiError = { error: string; message: string | string[]; statusCode: number };

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
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

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

  const { wallets } = useRecord();

  const datePickerRef = useRef<any>(null);
  const textInputRef = useRef<HTMLDivElement>(null);

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

  const { data: remarks = [] } = useQuery<string[]>({
    queryKey: ['remarks', selectedCategory?.id],
    queryFn: () => getRemarks(selectedCategory!.id),
    enabled: !!selectedCategory?.id,
  });

  /* ===================== CALC ===================== */

  const updateCalc = (key: string) => {
    if (key === '=') {
      return setValue((prev) => {
        try {
          return evaluate(prev).toString();
        } catch {
          return prev;
        }
      });
    }
    if (key === 'AC') return setValue('');
    if (key === 'DE') return setValue((prev) => prev.slice(0, -1));
    setValue((prev) => prev.concat(key));
  };

  /* ===================== MUTATIONS ===================== */

  const createRecordMutation = useMutation<
    IRecord,
    AxiosError<ApiError>,
    ICreateRecord,
    { previousWallets?: IWalletRecordWithCategory[] }
  >({
    mutationFn: createRecord,
    onMutate: async ({ id, price, remarks, date }) => {
      await queryClient.cancelQueries({ queryKey: ['wallets'] });

      const previousWallets =
        queryClient.getQueryData<IWalletRecordWithCategory[]>(['wallets']);

      queryClient.setQueryData<IWalletRecordWithCategory[]>(
        ['wallets'],
        (old = []) => {
          const walletIndex = old.findIndex((w) => w.id === wallet?.id);

          if (walletIndex >= 0 && selectedCategory) {
            const newRecord = {
              id,
              price,
              remarks,
              date,
              category: selectedCategory,
            };

            const copy = [...old];
            const walletCopy = { ...copy[walletIndex] };
            walletCopy.records = [newRecord as any, ...(walletCopy.records ?? [])];
            copy[walletIndex] = walletCopy;
            return copy;
          }

          return old;
        },
      );

      return { previousWallets };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousWallets) {
        queryClient.setQueryData(['wallets'], ctx.previousWallets);
      }
      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onSuccess: (_data, vars) => {
      toast(`${vars.category.name} is added`, { type: 'success' });
      setEditRecord({
        id: 0,
        price: 0,
        remarks: '',
        date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
      });
      updateCalc('AC');
    },
  });

  const updateRecordMutation = useMutation<
    IRecord,
    AxiosError<ApiError>,
    IRecord,
    { previousWallets?: IWalletRecordWithCategory[] }
  >({
    mutationFn: updateRecord,
    onMutate: async ({ id, price, remarks, date }) => {
      await queryClient.cancelQueries({ queryKey: ['wallets'] });

      const previousWallets =
        queryClient.getQueryData<IWalletRecordWithCategory[]>(['wallets']);

      queryClient.setQueryData<IWalletRecordWithCategory[]>(
        ['wallets'],
        (old = []) => {
          const walletIndex = old.findIndex((w) => w.id === wallet?.id);
          if (walletIndex < 0) return old;

          const recordIndex =
            old[walletIndex]?.records?.findIndex((r) => r.id === id) ?? -1;
          if (recordIndex < 0) return old;

          const copy = [...old];
          const walletCopy = { ...copy[walletIndex] };
          const recordsCopy = [...(walletCopy.records ?? [])];

          recordsCopy[recordIndex] = {
            ...recordsCopy[recordIndex],
            price,
            remarks,
            date,
          } as any;

          walletCopy.records = recordsCopy;
          copy[walletIndex] = walletCopy;
          return copy;
        },
      );

      return { previousWallets };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousWallets) {
        queryClient.setQueryData(['wallets'], ctx.previousWallets);
      }
      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error', {
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onSuccess: () => {
      toast('Record is updated', { type: 'success' });
    },
  });

  const removeRecordMutation = useMutation<
    void,
    AxiosError<ApiError>,
    number,
    { previousWallets?: IWalletRecordWithCategory[] }
  >({
    mutationFn: deleteRecord,
    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['wallets'] });

      const previousWallets =
        queryClient.getQueryData<IWalletRecordWithCategory[]>(['wallets']);

      queryClient.setQueryData<IWalletRecordWithCategory[]>(
        ['wallets'],
        (old = []) => {
          const walletIndex = old.findIndex((w) => w.id === wallet?.id);
          if (walletIndex < 0) return old;

          const copy = [...old];
          const walletCopy = { ...copy[walletIndex] };
          walletCopy.records = (walletCopy.records ?? []).filter(
            (r) => r.id !== recordId,
          );
          copy[walletIndex] = walletCopy;
          return copy;
        },
      );

      return { previousWallets };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousWallets) {
        queryClient.setQueryData(['wallets'], ctx.previousWallets);
      }
      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Delete failed', {
        type: 'error',
      });
    },
    onSuccess: () => {
      toast(`Record ID: ${editRecord.id} is deleted`, { type: 'info' });
      setOpenDelete(false);
      setOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>,
    mode: 'Once' | 'Continue',
  ) => {
    e.preventDefault();

    if (!editRecord.price) {
      toast('Please input the expense/income', { type: 'warning' });
      return;
    }
    if (!wallet) {
      toast('No wallet selected', { type: 'warning' });
      return;
    }
    if (!selectedCategory) {
      toast('Please select the category', { type: 'warning' });
      return;
    }

    if (editRecord.id === 0) {
      await createRecordMutation.mutateAsync({
        ...editRecord,
        wallet,
        category: selectedCategory,
      });
    } else {
      await updateRecordMutation.mutateAsync({ ...editRecord });
    }

    if (mode === 'Once') setOpen(false);
  };

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    const keyListener = (event: KeyboardEvent) => {
      const dateInput = datePickerRef.current?.input;
      const isInText =
        textInputRef.current?.contains(document.activeElement) ?? false;
      const isInDate = dateInput?.contains?.(document.activeElement) ?? false;

      if (isInText || isInDate) return;

      const reg = /\d|\/|\*|-|\+|\./g;

      if (event.key === 'Backspace') return updateCalc('DE');
      if (event.key === 'Enter') return updateCalc('=');
      if (reg.test(event.key)) return updateCalc(event.key);
    };

    window.addEventListener('keydown', keyListener);

    if (!isNaN(Number(value))) {
      setEditRecord((prev) => ({ ...prev, price: Number(value) }));
    }

    return () => window.removeEventListener('keydown', keyListener);
  }, [value, setEditRecord]);

  useEffect(() => {
    if (!categories.length || !user) return;

    const ordered: ICategory[] = [];
    user.categoryOrder.forEach((id) => {
      const found = categories.find((c) => c.id === Number(id));
      if (found) ordered.push(found);
    });
    setSortedCategories(ordered);
  }, [categories, user]);

  /* ===================== UI (GLASS) ===================== */

  const glassCard =
    'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow';

  return (
    <div>
      <CustomModal setOpen={setOpen} size="Medium">
        <form className="w-full text-white">
          <div className="mb-3">
            <p className="text-xl font-semibold">
              {editRecord.id === 0 ? 'New' : 'Update'}{' '}
              {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}
            </p>
            <p className="text-sm text-white/60">
              Add a record with calculator + quick remarks
            </p>
          </div>

          <div className={clsx(glassCard, 'p-3 mb-3')}>
            <CategorySelector
              options={Object.values(ECategoryType)}
              value={categoryType}
              toggle={(type) => setCategoryType(type as ECategoryType)}
            />

            {/* Category pills */}
            <div
              className={clsx(
                'rounded-xl mt-3 w-full overflow-auto p-2 border border-white/10',
                categoryType === ECategoryType.EXPENSE
                  ? 'bg-rose-500/10'
                  : 'bg-emerald-500/10',
              )}
            >
              <div className="grid grid-flow-col auto-cols-max grid-rows-3 gap-2 w-fit">
                {sortedCategories
                  .filter((c) => c.type === categoryType)
                  .map((category) => {
                    const active = selectedCategory?.id === category.id;

                    return (
                      <button
                        type="button"
                        key={category.id}
                        onClick={() => setSelectedCategory(category)}
                        className={clsx(
                          'rounded-xl px-3 py-2 flex items-center gap-2 border transition-all',
                          active
                            ? 'bg-white/15 border-white/20 text-white'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10',
                        )}
                      >
                        <IconSelector name={category.icon} />
                        <span className="text-sm">{category.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Wallet + Date */}
          <div className="flex gap-2 mb-3">
            <div className={clsx(glassCard, 'p-3 flex-1')}>
              <CustomSelector
                title={'Wallet:'}
                options={wallets?.map((w) => w.name) ?? []}
                value={wallet?.name}
                callbackAction={(val) => {
                  const newFavWallet = wallets?.find((w) => w.name === val);
                  if (newFavWallet) dispatch(updateFavWallet(newFavWallet.id));
                }}
              />
            </div>

            <div className={clsx(glassCard, 'p-3 w-[220px]')}>
              <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                <span>Date</span>
                <button
                  type="button"
                  className="text-xs text-emerald-200 hover:text-emerald-100"
                  onClick={() =>
                    setEditRecord((prev) => ({
                      ...prev,
                      date: DateTime.now().toFormat('yyyy-LL-dd'),
                    }))
                  }
                >
                  Today
                </button>
              </div>

              <DatePicker
                ref={datePickerRef}
                onChange={(d) => {
                  if (!d) return;
                  setEditRecord((prev) => ({
                    ...prev,
                    date:
                      DateTime.fromJSDate(d).toISO() ??
                      DateTime.fromJSDate(d).toFormat('yyyy-LL-dd'),
                  }));
                }}
                selected={new Date(editRecord.date)}
                className="w-full outline-none rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-white"
              />
            </div>
          </div>

          {/* Amount display */}
          <div className={clsx(glassCard, 'p-3 mb-3')}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Amount</span>
              <span className="text-sm text-white/60">
                {wallet?.currency ?? ''}
              </span>
            </div>
            <div className="text-2xl font-semibold text-right truncate">
              {value.length > 0 ? value : '0'}
            </div>
          </div>

          {/* Calculator */}
          <div className={clsx(glassCard, 'p-3 mb-3')}>
            <Calculator callback={(key) => updateCalc(key)} />
          </div>

          {/* Remarks */}
          <div className={clsx(glassCard, 'p-3 mb-3')} ref={textInputRef}>
            <CustomTextField
              type={'text'}
              name="Remarks"
              value={editRecord.remarks}
              callbackAction={(event: React.ChangeEvent<HTMLInputElement>) => {
                setEditRecord((prev) => ({
                  ...prev,
                  remarks: event.target.value,
                }));
              }}
            />

            {remarks.length > 0 && (
              <div className="text-sm pt-3 flex flex-wrap gap-2">
                {remarks.map((remark) => (
                  <button
                    key={remark}
                    type="button"
                    className="rounded-xl px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"
                    onClick={() =>
                      setEditRecord((prev) => ({ ...prev, remarks: remark }))
                    }
                  >
                    {remark}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              className="rounded-xl px-3 py-2 bg-white/10 border border-white/10 hover:bg-white/15 text-white"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>

            <button
              className="rounded-xl px-3 py-2 bg-emerald-500/20 border border-emerald-400/20 hover:bg-emerald-500/30 text-emerald-100"
              type="button"
              onClick={(e) => {
                if (editRecord.id === 0) handleSubmit(e, 'Continue');
                else setOpenDelete(true);
              }}
            >
              {editRecord.id === 0 ? 'Create & Continue' : 'Delete'}
            </button>

            <button
              className="rounded-xl px-3 py-2 bg-blue-500/25 border border-blue-400/20 hover:bg-blue-500/35 text-blue-100"
              type="button"
              onClick={(e) => handleSubmit(e, 'Once')}
            >
              {editRecord.id === 0 ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </CustomModal>

      {openDelete && (
        <CustomModal setOpen={setOpenDelete} size="Medium">
          <div className="text-white">
            <p className="text-lg font-semibold">Confirm delete?</p>
            <p className="text-sm text-white/60">
              This action cannot be undone.
            </p>

            <div className="flex justify-end pt-4 gap-2">
              <button
                className="rounded-xl px-3 py-2 bg-white/10 border border-white/10 hover:bg-white/15"
                type="button"
                onClick={() => setOpenDelete(false)}
              >
                Cancel
              </button>

              <button
                className="rounded-xl px-3 py-2 bg-rose-500/30 border border-rose-400/20 hover:bg-rose-500/40 text-rose-100"
                type="button"
                onClick={async () => {
                  await removeRecordMutation.mutateAsync(editRecord.id);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default RecordModal;