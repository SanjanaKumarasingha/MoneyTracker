import clsx from 'clsx';
import { BsArrowDownCircle, BsArrowUpCircle } from 'react-icons/bs';
import { Card } from '../ui';
import { formatMoney } from '../../utils';

// Total Balance now leads the page via HeroBalanceCard - this is a
// secondary detail strip, not a second "how much money" statement of equal
// weight, so it's deliberately one slim card with inline stats rather than
// two full-size Cards (mirrors Mobile's Home, which pairs the hero balance
// with a compact Cash Flow section, not a repeat of the balance itself).
export interface SummaryCardsProps {
  currency?: string;
  periodIncome: number;
  periodExpense: number;
  periodLabel: string;
  onClick?: () => void;
}

const SummaryCards = ({
  currency,
  periodIncome,
  periodExpense,
  periodLabel,
  onClick,
}: SummaryCardsProps) => {
  return (
    <Card
      padding="sm"
      onClick={onClick}
      className={clsx(
        'flex items-center divide-x divide-zinc-100 dark:divide-zinc-700',
        onClick && 'cursor-pointer hover:scale-[1.01] transition-transform',
      )}
    >
      <div className="flex-1 flex items-center gap-2 px-2">
        <BsArrowUpCircle className="text-lg text-success-500 dark:text-success-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            Income &middot; {periodLabel}
          </p>
          <p className="font-semibold text-success-600 dark:text-success-400 truncate">
            {formatMoney(periodIncome, currency)}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center gap-2 px-2">
        <BsArrowDownCircle className="text-lg text-danger-500 dark:text-danger-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            Expense &middot; {periodLabel}
          </p>
          <p className="font-semibold text-danger-600 dark:text-danger-400 truncate">
            {formatMoney(periodExpense, currency)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SummaryCards;
