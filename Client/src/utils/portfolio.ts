import { DateTime } from 'luxon';
import { IRecordWithCategory, IWalletRecordWithCategory } from '../types';
import { getCategoryColor } from './categoryColor';
import { PeriodRange, isDateInRange } from './period';

// Cross-wallet money math shared by Home and Wallets. RecordDataProvider only
// derives figures for the single selected ("fav") wallet, but net worth, asset
// totals and monthly cash flow are inherently portfolio-wide.
//
// Currency: wallets can each have their own currency and there is no FX
// conversion anywhere in the app, so nothing here ever adds two currencies
// together. Every aggregate is computed for ONE currency (the "primary" -
// the first wallet's, same convention Mobile uses) and callers surface the
// remaining currencies separately instead of silently mixing them.

const ISO = 'yyyy-LL-dd';

/** +price for income, -price for expense; 0 for a record whose category was deleted. */
export const signedAmount = (record: IRecordWithCategory): number => {
  if (!record.category) return 0;
  return record.category.type === 'expense' ? -Number(record.price) : Number(record.price);
};

export const getWalletBalance = (wallet: IWalletRecordWithCategory): number =>
  (wallet.records ?? []).reduce((acc, record) => acc + signedAmount(record), 0);

export const getPrimaryCurrency = (wallets: IWalletRecordWithCategory[]): string =>
  wallets[0]?.currency ?? 'USD';

export interface CurrencyTotal {
  currency: string;
  balance: number;
}

/** Sum of wallet balances per currency, primary currency first. */
export function getBalancesByCurrency(wallets: IWalletRecordWithCategory[]): CurrencyTotal[] {
  const primary = getPrimaryCurrency(wallets);
  const totals = new Map<string, number>();
  wallets.forEach((wallet) => {
    totals.set(wallet.currency, (totals.get(wallet.currency) ?? 0) + getWalletBalance(wallet));
  });
  return Array.from(totals, ([currency, balance]) => ({ currency, balance })).sort((a, b) =>
    a.currency === primary ? -1 : b.currency === primary ? 1 : 0,
  );
}

export interface NetWorthPoint {
  date: string;
  value: number;
}

export interface NetWorthTrend {
  /** Daily net worth for the trailing `days` days, oldest first, ending today. */
  series: NetWorthPoint[];
  current: number;
  /** Net worth at the end of last month. */
  lastMonthEnd: number;
  /** Absolute change since the end of last month. */
  change: number;
  /** Percent change since the end of last month; null when that base was 0. */
  changePercent: number | null;
}

/** Trailing daily net-worth series + month-over-month change, for one currency. */
export function getNetWorthTrend(
  wallets: IWalletRecordWithCategory[],
  currency: string,
  days = 30,
): NetWorthTrend {
  const records = wallets
    .filter((wallet) => wallet.currency === currency)
    .flatMap((wallet) => wallet.records ?? []);

  const today = DateTime.now().startOf('day');
  const windowStart = today.minus({ days: days - 1 });
  const windowStartKey = windowStart.toFormat(ISO);

  let base = 0;
  const flowByDay = new Map<string, number>();
  records.forEach((record) => {
    const day = record.date.slice(0, 10);
    const amount = signedAmount(record);
    if (day < windowStartKey) base += amount;
    else flowByDay.set(day, (flowByDay.get(day) ?? 0) + amount);
  });

  const series: NetWorthPoint[] = [];
  let running = base;
  for (let i = 0; i < days; i += 1) {
    const day = windowStart.plus({ days: i }).toFormat(ISO);
    running += flowByDay.get(day) ?? 0;
    series.push({ date: day, value: running });
  }

  const current = records.reduce((acc, record) => acc + signedAmount(record), 0);
  const lastMonthEndKey = today.startOf('month').minus({ days: 1 }).toFormat(ISO);
  const lastMonthEnd = records.reduce(
    (acc, record) => (record.date.slice(0, 10) <= lastMonthEndKey ? acc + signedAmount(record) : acc),
    0,
  );

  return {
    series,
    current,
    lastMonthEnd,
    change: current - lastMonthEnd,
    changePercent: lastMonthEnd !== 0 ? ((current - lastMonthEnd) / Math.abs(lastMonthEnd)) * 100 : null,
  };
}

export interface CashFlow {
  income: number;
  expense: number;
  net: number;
}

/**
 * Income/expense over a period for one currency. Wallet-to-wallet transfers
 * are excluded: moving money between your own wallets isn't earning or
 * spending (same rule RecordDataProvider applies to its category grouping).
 */
export function getCashFlow(
  wallets: IWalletRecordWithCategory[],
  currency: string,
  range: PeriodRange | null,
): CashFlow {
  let income = 0;
  let expense = 0;
  wallets
    .filter((wallet) => wallet.currency === currency)
    .forEach((wallet) =>
      (wallet.records ?? []).forEach((record) => {
        if (record.isTransfer || !record.category || !isDateInRange(record.date, range)) return;
        if (record.category.type === 'expense') expense += Number(record.price);
        else income += Number(record.price);
      }),
    );
  return { income, expense, net: income - expense };
}

export interface CategorySpend {
  categoryId: number;
  name: string;
  icon: NonNullable<IRecordWithCategory['category']>['icon'];
  color: string;
  amount: number;
}

/** Expense totals per category for one currency over a period, largest first. */
export function getSpendingByCategory(
  wallets: IWalletRecordWithCategory[],
  currency: string,
  range: PeriodRange | null,
): CategorySpend[] {
  const byCategory = new Map<number, CategorySpend>();
  wallets
    .filter((wallet) => wallet.currency === currency)
    .forEach((wallet) =>
      (wallet.records ?? []).forEach((record) => {
        const category = record.category;
        if (record.isTransfer || !category || category.type !== 'expense') return;
        if (!isDateInRange(record.date, range)) return;
        const existing = byCategory.get(category.id);
        if (existing) existing.amount += Number(record.price);
        else
          byCategory.set(category.id, {
            categoryId: category.id,
            name: category.name,
            icon: category.icon,
            color: getCategoryColor(category.id),
            amount: Number(record.price),
          });
      }),
    );
  return Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
}

export type WalletTone = 'navy' | 'emerald' | 'crimson' | 'amber';

const TONE_ORDER: WalletTone[] = ['navy', 'emerald', 'crimson', 'amber'];

// Wallets have no "type" field, so a wallet's role is inferred from what the
// user called it (Investment -> navy, Income -> emerald, Spending -> crimson,
// Goals/Savings -> amber); anything unrecognised cycles through the same four
// tones by position, so a fresh set of four wallets still reads as the full
// palette rather than four identical cards.
export function getWalletTone(name: string, index: number): WalletTone {
  const n = name.toLowerCase();
  if (/invest|stock|equit|crypto|fund|portfolio|brokerage|retire/.test(n)) return 'navy';
  if (/income|salary|wage|earn|pay ?check|revenue/.test(n)) return 'emerald';
  if (/spend|expens|daily|everyday|shopping|bills|card|cash/.test(n)) return 'crimson';
  if (/goal|saving|save|emergency|travel|vacation|holiday|fund$/.test(n)) return 'amber';
  return TONE_ORDER[index % TONE_ORDER.length];
}
