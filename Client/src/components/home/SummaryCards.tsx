import { BsArrowDownCircle, BsArrowUpCircle, BsWallet2 } from 'react-icons/bs';
import { Card } from '../ui';
import { formatMoney } from './utils';

export interface SummaryCardsProps {
  currency?: string;
  totalBalance: number;
  periodIncome: number;
  periodExpense: number;
  periodLabel: string;
}

const SummaryCards = ({
  currency,
  totalBalance,
  periodIncome,
  periodExpense,
  periodLabel,
}: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total Balance
            </p>
            <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 truncate">
              {formatMoney(totalBalance, currency)}
            </p>
          </div>
          <div className="text-3xl text-primary-500 dark:text-primary-300 shrink-0">
            <BsWallet2 />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              Income &middot; {periodLabel}
            </p>
            <p className="text-2xl font-semibold text-success-600 dark:text-success-400 truncate">
              {formatMoney(periodIncome, currency)}
            </p>
          </div>
          <div className="text-3xl text-success-500 dark:text-success-400 shrink-0">
            <BsArrowUpCircle />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              Expense &middot; {periodLabel}
            </p>
            <p className="text-2xl font-semibold text-danger-600 dark:text-danger-400 truncate">
              {formatMoney(periodExpense, currency)}
            </p>
          </div>
          <div className="text-3xl text-danger-500 dark:text-danger-400 shrink-0">
            <BsArrowDownCircle />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SummaryCards;
