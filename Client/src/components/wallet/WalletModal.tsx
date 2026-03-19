import React from 'react';
import CustomModal from '../Custom/CustomModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWallet, deleteWallet, updateWallet } from '../../apis/wallet';
import { ICreateWallet, IWallet } from '../../types';
import { currencyList } from '../../utils';
import CustomSelector from '../Custom/CustomSelector';
import CustomTextField from '../Custom/CustomTextField';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../provider/AuthProvider';
import { useAppDispatch } from '../../hooks';
import { updateFavWallet } from '../../store/walletSlice';

type WalletModalProps = {
  type: 'Create' | 'Edit' | 'Delete';
  editWallet: IWallet;
  setEditWallet: React.Dispatch<React.SetStateAction<IWallet>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const WalletModal = ({
  type,
  editWallet,
  setOpen,
  setEditWallet,
}: WalletModalProps) => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const dispatch = useAppDispatch();

  const glassCard =
    'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow text-white';

  // Create wallet mutation
  const createWalletMutation = useMutation<
    IWallet,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    Partial<ICreateWallet>
  >({
    mutationFn: createWallet,
    onMutate: async ({ id, name, currency }) => {
      await queryClient.cancelQueries({ queryKey: ['wallets', userId] });

      queryClient.setQueryData<IWallet[]>(['wallets', userId], (oldData) => {
        if (oldData) {
          return [...oldData, { id, name, currency } as IWallet];
        }
        return oldData;
      });

      return {
        previousWallets: queryClient.getQueryData<IWallet[]>(['wallets', userId]),
      };
    },
    onError: (error, variables, context) => {
      const typedContext = context as {
        previousWallets: IWallet[] | undefined;
      };

      if (typedContext.previousWallets) {
        queryClient.setQueryData<IWallet[]>(
          ['wallets', userId],
          typedContext.previousWallets,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    },
    onSuccess(data) {
      dispatch(updateFavWallet(data.id));
      toast(
        `Wallet is created\nName: ${data.name}\nCurrency:${data.currency}`,
        { type: 'success' },
      );
      setOpen(false);
    },
    retry: 3,
  });

  // Update wallet mutation
  const updateWalletMutation = useMutation<
    IWallet,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    IWallet
  >({
    mutationFn: updateWallet,
    onMutate: async ({ id, name, currency }) => {
      await queryClient.cancelQueries({ queryKey: ['wallets', userId] });

      queryClient.setQueryData<IWallet[]>(['wallets', userId], (oldData) => {
        if (oldData) {
          oldData.forEach((old) => {
            if (old.id === id) {
              old.currency = currency;
              old.name = name;
            }
          });
        }
        return oldData;
      });

      return {
        previousWallets: queryClient.getQueryData<IWallet[]>(['wallets', userId]),
      };
    },
    onError: (error, variables, context) => {
      const typedContext = context as {
        previousWallets: IWallet[] | undefined;
      };

      if (typedContext.previousWallets) {
        queryClient.setQueryData<IWallet[]>(
          ['wallets', userId],
          typedContext.previousWallets,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    },
    onSuccess(data) {
      toast(
        `Wallet is updated\nName: ${data.name}\nCurrency:${data.currency}`,
        { type: 'success' },
      );
      setOpen(false);
    },
    retry: 3,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const wallet: Partial<IWallet> = {
      ...editWallet,
    };

    try {
      if (type === 'Create') {
        if (!userId) {
          toast('User ID is not available', { type: 'error' });
          return;
        }

        await createWalletMutation.mutateAsync({
          ...wallet,
          userId,
        });
      } else {
        await updateWalletMutation.mutateAsync({ ...editWallet });
      }
    } catch (error) {
      console.error('Error creating/editing wallet:', error);
    } finally {
      setEditWallet({ id: 0, name: '', currency: '' });
    }
  };

  const removeWalletMutation = useMutation({
    mutationFn: deleteWallet,
    onError(error, variables, context) {},
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['wallets', userId] });

      queryClient.setQueryData<IWallet[]>(['wallets', userId], (oldData) => {
        if (oldData) {
          return oldData.filter((prev) => prev.id !== variables);
        }
        return oldData;
      });

      return {
        previousWallets: queryClient.getQueryData<IWallet[]>(['wallets', userId]),
      };
    },
    onSuccess(data) {
      toast(
        `Wallet is deleted.\nName: ${data.name}\nCurrency:${data.currency}`,
        { type: 'info' },
      );
      setOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    },
  });

  if (type === 'Delete') {
    return (
      <CustomModal setOpen={setOpen} size="Medium">
        <div className={`${glassCard} p-5`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">Delete Wallet</h2>
            <p className="mt-1 text-sm text-white/60">
              Are you sure you want to delete this wallet?
            </p>
          </div>

          <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            This action cannot be undone.
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium bg-rose-500/30 border border-rose-400/20 text-rose-100 hover:bg-rose-500/40 active:bg-rose-500/50"
              onClick={async () => {
                try {
                  await removeWalletMutation.mutateAsync(editWallet.id);
                } catch (error) {}
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </CustomModal>
    );
  }

  return (
    <CustomModal setOpen={setOpen}>
      <div className={`${glassCard} p-5`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {type === 'Create' ? 'Add New Wallet' : 'Edit Wallet'}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {type === 'Create'
                ? 'Create a wallet to organize your transactions.'
                : 'Update wallet name or currency.'}
            </p>
          </div>

          {/* Inputs */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <CustomTextField
              type={'text'}
              name={'Name'}
              value={editWallet.name}
              callbackAction={(event) => {
                setEditWallet((prev) => {
                  return {
                    ...prev,
                    name: event.target.value,
                  };
                });
              }}
            />

            <CustomSelector
              title={'Currency'}
              options={currencyList}
              value={editWallet.currency}
              callbackAction={(option) => {
                setEditWallet((prev) => {
                  return { ...prev, currency: option };
                });
              }}
              filter
              placeholder="ISO Code of currency"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium bg-emerald-500/20 border border-emerald-400/20 text-emerald-100 hover:bg-emerald-500/30 active:bg-emerald-500/40"
              type="submit"
            >
              {type === 'Create' ? 'Create Wallet' : 'Update Wallet'}
            </button>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default WalletModal;
