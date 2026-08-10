import clsx from 'clsx';
import { BsGraphDownArrow, BsGraphUpArrow } from 'react-icons/bs';
import { formatMoney } from './utils';

export interface HeroBalanceCardProps {
  username?: string;
  balance: number;
  currency?: string;
  /** This period's net (income - expense) vs. the previous period's net. */
  trendDelta: number;
  onClick?: () => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Mirrors Mobile's Home hero (Mobile/app/(app)/(tabs)/index.tsx): a diagonal
// primary-color gradient banner leading with identity + net worth, rather
// than a plain "Dashboard" heading - the first thing this page says is "how
// much money do you have," not a page title.
const HeroBalanceCard = ({
  username,
  balance,
  currency,
  trendDelta,
  onClick,
}: HeroBalanceCardProps) => {
  const isUp = trendDelta >= 0;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick();
      }}
      className={clsx(
        'rounded-2xl shadow-card p-5 sm:p-6 text-white bg-gradient-to-br from-primary-500 to-primary-900',
        onClick && 'cursor-pointer hover:scale-[1.01] transition-transform',
      )}
    >
      <p className="text-sm font-semibold text-white/85">
        {greetingForHour(new Date().getHours())}
        {username && (
          <>
            , <span className="font-extrabold text-white">{username}</span>
          </>
        )}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">
            Total Balance
          </p>
          <p className="text-3xl font-extrabold tracking-tight truncate">
            {formatMoney(balance, currency)}
          </p>
        </div>

        <div
          className={clsx(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shrink-0',
            isUp ? 'bg-success-500/25' : 'bg-danger-500/25',
          )}
        >
          {isUp ? <BsGraphUpArrow /> : <BsGraphDownArrow />}
          <span>
            {isUp ? '+' : '-'}
            {formatMoney(Math.abs(trendDelta), currency)} this month
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroBalanceCard;
