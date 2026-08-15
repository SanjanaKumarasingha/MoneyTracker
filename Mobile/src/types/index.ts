import { EIconName } from './icon-name.enum';
import { EGoalType } from './goal-type.enum';
import { EGoalPeriodType } from './goal-period-type.enum';

export interface ApiError {
  error: string;
  message: string | string[];
  statusCode: number;
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

export interface NewUser extends IUser {
  email: string;
  confirmPassword: string;
}

// Mirrors Client/src/common/category-type.ts.
export enum ECategoryType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export interface IGoal {
  id: number;
  name: string | null;
  type: EGoalType;
  periodType: EGoalPeriodType;
  targetAmount: number;
  startDate: string;
  endDate: string | null;
  wallet: IWallet;
  category: ICategory | null;
}

export interface ICreateGoal {
  name: string | null;
  type: EGoalType;
  periodType: EGoalPeriodType;
  targetAmount: number;
  startDate: string;
  endDate: string | null;
  userId: number;
  walletId: number;
  categoryId?: number;
}

export interface IGoalProgress {
  periodStart: string;
  periodEnd: string;
  isActive: boolean;
  actual: number;
  remaining: number;
  percent: number;
  status: 'met' | 'in-progress' | 'exceeded' | 'within-limit';
}

export interface IGoalWithProgress extends IGoal {
  progress: IGoalProgress;
}

export interface IWalletSummaryCategory {
  categoryId: number;
  name: string;
  icon: EIconName;
  type: TCategoryType;
  amount: number;
  previousAmount: number;
}

export interface IWalletSummary {
  periodStart: string;
  periodEnd: string;
  income: number;
  expense: number;
  categories: IWalletSummaryCategory[];
}
