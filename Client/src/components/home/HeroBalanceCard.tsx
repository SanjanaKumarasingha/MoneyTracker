import { useState } from 'react';
import clsx from 'clsx';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { BsGraphDownArrow, BsGraphUpArrow } from 'react-icons/bs';
import { formatMoney } from '../../utils';
import { CurrencyTotal, NetWorthTrend } from '../../utils/portfolio';
import Sparkline from './Sparkline';
import { Money, Pill } from '../ui';

export interface HeroBalanceCardProps {
  username?: string;
  currency: string;
  trend: NetWorthTrend;
  /** Balances in currencies other than `currency` - shown as chips, never summed in. */
  otherBalances?: CurrencyTotal[];
  monthIncome: number;
  monthExpense: number;
  onClick?: () => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// The page's first statement is "how much money do you have": total net worth
// (the sum of every wallet, not just the selected one) with a 30-day trend
// and the month-over-month change beside it - the same identity-first hero as
// Mobile's Home. Light mode: royal-blue gradient with a glass glare. Dark
// mode: an executive titanium card (matte obsidian, faint brushed-metal
// grain, luminous sparkline) via `.lux-titanium`.
const HeroBalanceCard = ({
  username,
  currency,
  trend,
  otherBalances = [],
  monthIncome,
  monthExpense,
  onClick,
}: HeroBalanceCardProps) => {
  const isUp = trend.change >= 0;
  // Session-only privacy toggle (mirrors Mobile's balanceHidden): lets you
  // open the app in public without broadcasting the figure.
  const [hidden, setHidden] = useState(false);
  const mask = (text: string) => (hidden ? '••••••' : text);

  const percentText =
    trend.changePercent === null
      ? null
      : `${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        'lux-titanium relative overflow-hidden rounded-2xl shadow-card p-5 sm:p-7 text-white',
        'bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900',
        onClick && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 right-10 h-80 w-36 rotate-[22deg] bg-gradient-to-b from-transparent via-white/10 to-transparent"
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
      {/* Ambient sapphire backlight bleeding in from the top-right (dark only). */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 hidden h-64 w-64 rounded-full bg-sky-400/10 blur-3xl dark:block"
      />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/85">
            {greetingForHour(new Date().getHours())}
            {username && (
              <>
                , <span className="font-extrabold text-white">{username}</span>
              </>
            )}
          </p>

          <div className="mt-3 flex items-center gap-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              Total net worth
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setHidden((prev) => !prev);
              }}
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
              className="text-white/75 hover:text-white cursor-pointer"
            >
              {hidden ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>

          <p className="mt-1.5 break-words">
            <Money
              amount={trend.current}
              prefix={trend.current < 0 ? '−' : undefined}
              currency={currency}
              tone="onColor"
              masked={hidden}
              className="text-4xl sm:text-5xl"
            />
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill
              title={`${isUp ? '+' : '−'}${formatMoney(Math.abs(trend.change), currency)} since the end of last month`}
              className={clsx(
                'font-semibold',
                isUp
                  ? 'bg-emerald-400/25 border-transparent text-emerald-100 dark:bg-emerald-400/10 dark:border-emerald-300/20 dark:text-emerald-300'
                  : 'bg-rose-400/25 border-transparent text-rose-100 dark:bg-rose-400/10 dark:border-rose-300/20 dark:text-rose-300',
              )}
            >
              {isUp ? <BsGraphUpArrow /> : <BsGraphDownArrow />}
              {hidden
                ? '••••'
                : `${percentText ?? `${isUp ? '+' : '−'}${formatMoney(Math.abs(trend.change), currency)}`} vs last month`}
            </Pill>

            {otherBalances.map((other) => (
              <Pill
                key={other.currency}
                className="bg-white/15 border-transparent font-semibold text-white/90 dark:bg-white/5 dark:border-white/10 dark:text-slate-300"
                title="Different currency - not included in the total above"
              >
                + {mask(formatMoney(other.balance, other.currency))}
              </Pill>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <Sparkline
            values={trend.series.map((point) => point.value)}
            color="#ffffff"
            luminous
            className="h-20 w-full"
          />
          <div className="mt-1 flex justify-between text-[11px] font-medium text-white/60">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm">
        <div>
          <p className="text-xs font-semibold text-white/65">Income this month</p>
          <p className="mt-0.5">
            <Money amount={monthIncome} prefix="+" currency={currency} tone="onColorPositive" masked={hidden} className="text-lg" />
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/65">Spent this month</p>
          <p className="mt-0.5">
            <Money amount={monthExpense} prefix="−" currency={currency} tone="onColorNegative" masked={hidden} className="text-lg" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroBalanceCard;
