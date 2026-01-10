import { Axios } from '.';
import { IWallet, ICreateWallet, IWalletRecordWithCategory } from '../types';

export const fetchWallets = async (
  userId: number,
): Promise<IWalletRecordWithCategory[]> => {
  const response = await Axios.get(`/v1/wallets/user/${userId}`);

  return response.data;
};

// Create wallet mutation
export const createWallet = async (
  newWallet: Partial<ICreateWallet>,
): Promise<IWallet> => {
  const response = await Axios.post('/v1/wallets', newWallet);
  return response.data;
};

export async function fetchWallet(id: number) {}

export async function updateWallet(wallet: Partial<IWallet>): Promise<IWallet> {
  console.log(wallet);
  const response = await Axios.patch(`/v1/wallets/${wallet.id}`, {
    name: wallet.name,
    currency: wallet.currency,
  });
  return response.data;
}

export async function deleteWallet(id: number) {
  const url = `v1/wallets/${id}`;

  const response = await Axios.delete(url);

  return response.data;
}
