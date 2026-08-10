import { BsPieChart } from 'react-icons/bs';
import { Card, EmptyState } from '../ui';
import { IGroupByCategoryRecord } from '../../types';
import { getCategoryColor } from '../../utils/categoryColor';
import { formatMoney } from './utils';

// Replaces the doughnut chart that used to live here (see git history:
// ExpenseChartCard.tsx) - it was an unbounded chart.js doughnut duplicating
// the one already on the dedicated Charts page (/charts), and its size grew
// with the page width. Mobile's own Home screen has no doughnut at all for
// exactly this reason - its "Top Spending" section is a plain colored
// mini-list (Mobile/app/(app)/(tabs)/index.tsx), and this ports that same,
// lighter pattern to web instead of a second copy of the Charts page.
export interface TopSpendingCardProps {
  periodLabel: string;
  records?: IGroupByCategoryRecord;
  currency?: string;
  onAddRecord?: () => void;
}

const TOP_N = 5;

const TopSpendingCard = ({
  periodLabel,
  records,
  currency,
  onAddRecord,
}: TopSpendingCardProps) => {
  const expenseByCategory = records?.expense ?? {};

  const ranked = Object.entries(expenseByCategory)
    .map(([name, categoryRecords]) => ({
      name,
      categoryId: categoryRecords[0]?.category?.id,
      amount: categoryRecords.reduce((acc, cur) => acc + Number(cur.price), 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_N);

  const topAmount = ranked[0]?.amount ?? 0;

  return (
    <Card title={`Top Spending · ${periodLabel}`}>
      {ranked.length === 0 ? (
        <EmptyState
          icon={<BsPieChart />}
          title={`No expenses in ${periodLabel}`}
          description="Add a record for this period to see where your money goes."
          actionLabel={onAddRecord ? 'Add a record' : undefined}
          onAction={onAddRecord}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {ranked.map((item) => {
            const color = getCategoryColor(item.categoryId);
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-200 w-24 truncate shrink-0">
                  {item.name}
                </span>
                <span className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${topAmount > 0 ? (item.amount / topAmount) * 100 : 0}%`,
                      backgroundColor: color,
                    }}
                  />
                </span>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 shrink-0">
                  {formatMoney(item.amount, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default TopSpendingCard;
