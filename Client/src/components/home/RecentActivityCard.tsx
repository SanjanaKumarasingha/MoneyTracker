import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AiOutlinePlus } from 'react-icons/ai';
import { BsReceipt } from 'react-icons/bs';
import { Button, Card, EmptyState, SkeletonText } from '../ui';
import IconSelector from '../IconSelector';
import { IRecordWithCategory } from '../../types';
import { formatMoney } from './utils';

export interface RecentActivityCardProps {
  records: IRecordWithCategory[];
  currency?: string;
  isLoading: boolean;
  onAddRecord: () => void;
}

const RecentActivityCard = ({
  records,
  currency,
  isLoading,
  onAddRecord,
}: RecentActivityCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">
          Recent Activity
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Add record"
            onClick={onAddRecord}
          >
            <AiOutlinePlus />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/records')}
          >
            View all
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonText lines={4} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<BsReceipt />}
          title="No records yet"
          description="Transactions for this wallet will show up here once you add one."
          actionLabel="Add a record"
          onAction={onAddRecord}
        />
      ) : (
        <div className="space-y-1">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between rounded-md bg-white dark:bg-zinc-800 p-1 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={clsx(
                    'text-white rounded-full p-1 shrink-0',
                    record.category.type === 'expense'
                      ? 'bg-danger-500'
                      : 'bg-success-500',
                  )}
                >
                  <IconSelector name={record.category.icon} />
                </div>
                <span className="truncate text-zinc-800 dark:text-zinc-100">
                  {record.category.name}
                </span>
              </div>
              <span
                className={clsx(
                  'shrink-0 font-medium',
                  record.category.type === 'expense'
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-success-600 dark:text-success-400',
                )}
              >
                {record.category.type === 'expense' && '-'}
                {formatMoney(Number(record.price), currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecentActivityCard;
