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

  // Create wallet mutation
  const createWalletMutation = useMutation<
    IWallet,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    Partial<ICreateWallet>
  >(createWallet, {
    onMutate: async ({ id, name, currency }) => {
      // Optimistically update the cache
      queryClient.setQueryData<IWallet[]>(['wallets'], (oldData) => {
        if (oldData) {
          return [...oldData, { id, name, currency } as IWallet];
        }
        return oldData;
      });

      return {
        previousWallets: queryClient.getQueryData<IWallet[]>(['wallets']),
      };
    },
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousWallets: IWallet[] | undefined;
      };

      if (typedContext.previousWallets) {
        queryClient.setQueryData<IWallet[]>(
          ['wallets'],
          typedContext.previousWallets,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries(['wallets']);
    },
    onSuccess(data, variables, context) {
      toast(
        `Wallet is created\nName: ${data.name}\nCurrency:${data.currency}`,
        { type: 'success' },
      );
    },
    retry: 3,
  });

  // Update wallet mutation
  const updateWalletMutation = useMutation<
    IWallet,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    IWallet
  >(updateWallet, {
    onMutate: async ({ id, name, currency }) => {
      // Optimistically update the cache
      queryClient.setQueryData<IWallet[]>(['wallets'], (oldData) => {
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
        previousWallets: queryClient.getQueryData<IWallet[]>(['wallets']),
      };
    },
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousWallets: IWallet[] | undefined;
      };

      if (typedContext.previousWallets) {
        queryClient.setQueryData<IWallet[]>(
          ['wallets'],
          typedContext.previousWallets,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries(['wallets']);
    },
    onSuccess(data, variables, context) {
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
        // Call the mutation to create the wallet
        await createWalletMutation.mutateAsync({
          ...wallet,
          userId,
        });
      } else {
        await updateWalletMutation.mutateAsync({ ...editWallet });
      }

      // The onSuccess callback will automatically update the cache with the actual data
    } catch (error) {
      console.error('Error creating/editing wallet:', error);
      // Handle error here and set appropriate error message if needed
    } finally {
      setEditWallet({ id: 0, name: '', currency: '' });
    }
  };

  const removeWalletMutation = useMutation(deleteWallet, {
    onError(error, variables, context) {},
    onMutate: async (variables) => {
      queryClient.setQueryData<IWallet[]>(['wallets'], (oldData) => {
        if (oldData) {
          return oldData.filter((prev) => prev.id !== variables);
        }
        return oldData;
      });

      return {
        previousWallets: queryClient.getQueryData<IWallet[]>(['wallets']),
      };
    },
    onSuccess(data, variables, context) {
      toast(
        `Wallet is deleted.\nName: ${data.name}\nCurrency:${data.currency}`,
        { type: 'info' },
      );
      setOpen(false);
    },
  });

  if (type === 'Delete')
    return (
      <CustomModal setOpen={setOpen} size="Medium">
        <div>
          <span className="text-lg">Confirm to delete the wallet?</span>

          <div className="flex justify-end pt-2">
            <button
              className="bg-info-400 w-fit p-1 rounded-md text-white hover:bg-info-300 cursor-pointer active:bg-info-500 select-none"
              onClick={async () => {
                try {
                  await removeWalletMutation.mutateAsync(editWallet.id);
                } catch (error) {}
              }}
            >
              DELETE
            </button>
          </div>
        </div>
      </CustomModal>
    );

  return (
    <CustomModal setOpen={setOpen}>
      <div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="text-2xl">
            {type === 'Create' ? 'Add new wallet' : 'Edit wallet'}
          </div>

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

          <div className="flex justify-end">
            <button
              className="bg-info-400 w-fit p-1 rounded-md text-white hover:bg-info-300 cursor-pointer active:bg-info-500 select-none"
              type="submit"
            >
              {type === 'Create' ? 'CREATE' : 'UPDATE'}
            </button>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default WalletModal;
