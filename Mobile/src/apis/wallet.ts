import { Axios } from './index';
import { IWallet, ICreateWallet, IWalletRecordWithCategory } from '../types';

export const fetchWallets = async (
  userId: number,
): Promise<IWalletRecordWithCategory[]> => {
  const response = await Axios.get(`/wallets/user/${userId}`);

  return response.data;
};

// Create wallet mutation
export const createWallet = async (
  newWallet: Partial<ICreateWallet>,
): Promise<IWallet> => {
  const response = await Axios.post('/wallets', newWallet);
  return response.data;
};

export async function fetchWallet(id: number) {}

export async function updateWallet(wallet: Partial<IWallet>): Promise<IWallet> {
  const response = await Axios.patch(`/wallets/${wallet.id}`, {
    name: wallet.name,
    currency: wallet.currency,
  });
  return response.data;
}

export async function deleteWallet(id: number) {
  const url = `/wallets/${id}`;

  const response = await Axios.delete(url);

  return response.data;
}
