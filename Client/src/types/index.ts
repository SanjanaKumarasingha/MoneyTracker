import { EIconName } from '../common/icon-name.enum';

export interface ApiError { 
  error: string; 
  message: string | string[]; 
  statusCode: number 
}

export interface IUser {
  username: string;
  password: string;
}

export interface IWallet {
  id: number;
  name: string;
  currency: string;
}

export type TCategoryType = 'expense' | 'income';

export interface ICategory {
  id: number;
  name: string;
  icon: EIconName;
  enable: boolean;
  type: TCategoryType;
}

export interface IRecord {
  id: number;
  price: number;
  remarks: string;
  date: string;
  // True for both halves of a wallet-to-wallet transfer (see
  // apis/transfer.ts). The server attaches a synthetic, display-only
  // category to these (name "Transfer", type mirroring transferDirection)
  // so `category` below is never actually null for a transfer record.
  isTransfer?: boolean;
  transferDirection?: 'in' | 'out' | null;
}

export interface IRecordWithCategory extends IRecord {
  // Null when a record's category was later deleted (server soft-deletes
  // categories rather than hard-deleting, so the join comes back null) —
  // always guard reads of this with `record.category?.x` or a null check.
  category: ICategory | null;
}

export interface ITransferRecord {
  fromWalletId: number;
  toWalletId: number;
  amount: number;
  date: string;
  remarks?: string;
}
export interface IWalletRecordWithCategory extends IWallet {
  records: IRecordWithCategory[];
}
export interface LoginResponse {
  access_token: string;
  user: IUserInfo;
}

export interface ICreateWallet extends IWallet {
  userId: number;
}

export interface ICreateCategory extends ICategory {
  userId: number;
}

export interface ICreateRecord extends IRecord {
  wallet: IWallet;
  category: ICategory;
}

export interface IUserInfo {
  id: number;
  username: string;
  email: string;
  categoryOrder: number[];
}

export interface IUpdatePasswordDto extends IUserInfo {
  oldPassword: string;
  newPassword: string;
}

export interface IGroupByCategoryRecord {
  income: { [key: string]: IRecordWithCategory[] };
  expense: { [key: string]: IRecordWithCategory[] };
}
