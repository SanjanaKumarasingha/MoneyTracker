import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { BsReceipt } from 'react-icons/bs';
import { Button, Card, EmptyState, SkeletonText } from '../ui';
import IconSelector from '../IconSelector';
import { IRecordWithCategory } from '../../types';
import { formatMoney } from '../../utils';
import { getCategoryColor } from '../../utils/categoryColor';
import { relativeDayLabel } from '../../utils/period';

export interface ActivityItem {
  record: IRecordWithCategory;
  walletName: string;
  currency: string;
}

export interface RecentActivityCardProps {
  items: ActivityItem[];
  /** Show the wallet tag on each row (pointless when there's only one wallet). */
  showWalletTag: boolean;
  isLoading: boolean;
  onAddRecord: () => void;
}

// Latest transactions across every wallet. Each row: category icon in its
// identity color, category badge, note, wallet tag, relative day, and a bold
// signed amount (+emerald income / −rose expense).
const RecentActivityCard = ({
  items,
  showWalletTag,
  isLoading,
  onAddRecord,
}: RecentActivityCardProps) => {
  const navigate = useNavigate();

  return (
    <Card padding="none" className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent activity</h2>
        {/* No inline "+" here - Home has one page-level GlassFab as the
            single "Add record" entry point (two same-weight add affordances
            split attention instead of presenting one clear primary action). */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/records')}>
          View all
        </Button>
      </div>

      {isLoading ? (
        <div className="px-5 pb-5">
          <SkeletonText lines={5} />
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState
            icon={<BsReceipt />}
            title="No records yet"
            description="Transactions will show up here once you add one."
            actionLabel="Add a record"
            onAction={onAddRecord}
          />
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06] border-t border-zinc-100 dark:border-white/[0.06]">
          {items.map(({ record, walletName, currency }) => {
            const category = record.category;
            const isExpense = category?.type === 'expense';
            return (
              <li
                key={record.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                  style={{
                    backgroundColor: record.isTransfer ? '#64748b' : getCategoryColor(category?.id),
                  }}
                >
                  {category && <IconSelector name={category.icon} />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {category?.name ?? 'Deleted category'}
                    </span>
                    {showWalletTag && (
                      <span className="rounded-md bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                        {walletName}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {relativeDayLabel(record.date)}
                    {record.remarks ? ` · ${record.remarks}` : ''}
                  </p>
                </div>

                <span
                  className={clsx(
                    'shrink-0 text-base font-bold tabular-nums',
                    !category
                      ? 'text-zinc-400 dark:text-zinc-500'
                      : isExpense
                      ? 'text-danger-600 dark:text-danger-400'
                      : 'text-success-600 dark:text-success-400',
                  )}
                >
                  {category && (isExpense ? '−' : '+')}
                  {formatMoney(Number(record.price), currency)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default RecentActivityCard;
