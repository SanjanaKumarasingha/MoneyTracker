import { ReactNode } from 'react';
import clsx from 'clsx';
import { formatMoney } from '../../utils';
import { WalletTone } from '../../utils/portfolio';
import { WalletBudget } from '../../utils/goalStatus';
import { Money, ProgressBar } from '../ui';

// Wallet cards, one color per wallet "role": navy = investment, emerald =
// income, crimson = spending, amber = goals/savings. See getWalletTone() for
// how a wallet's role is inferred from its name.
// Light mode keeps the deep saturated gradients (white text stays AA on
// them). Dark mode swaps them for smoked-glass obsidian via `.lux-glass`
// (index.css): the tone shows up only as a restrained light-leak glow in the
// top-right corner and a hairline metallic edge, selected by `data-tone`.
const TONE_STYLES: Record<WalletTone, { gradient: string; ring: string; label: string }> = {
  navy: { gradient: 'from-blue-800 to-slate-900', ring: 'ring-blue-400/25', label: 'Investment' },
  emerald: { gradient: 'from-emerald-600 to-emerald-900', ring: 'ring-emerald-300/25', label: 'Income' },
  crimson: { gradient: 'from-rose-600 to-rose-900', ring: 'ring-rose-300/25', label: 'Spending' },
  amber: { gradient: 'from-amber-600 to-amber-900', ring: 'ring-amber-200/25', label: 'Goals' },
};

export type WalletCardAction = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

export interface WalletCardProps {
  name: string;
  currency: string;
  balance: number;
  tone: WalletTone;
  /** compact: Home row. rich: Wallets hub (adds this-month flow + footer buttons). */
  variant?: 'compact' | 'rich';
  /** Budget usage track; null/undefined shows a "no budget" hint instead. */
  budget?: WalletBudget | null;
  /** This month's flow, shown on the rich variant. */
  monthIncome?: number;
  monthExpense?: number;
  onClick?: () => void;
  /** Small icon buttons, top-right (edit / export / delete). */
  actions?: WalletCardAction[];
  /** Labeled buttons along the bottom edge of the rich variant. */
  footerActions?: WalletCardAction[];
  className?: string;
}

const budgetBarColor = (percent: number) =>
  percent >= 90 ? '#fecdd3' : percent >= 70 ? '#fde68a' : '#ffffff';

const WalletCard = ({
  name,
  currency,
  balance,
  tone,
  variant = 'compact',
  budget,
  monthIncome,
  monthExpense,
  onClick,
  actions = [],
  footerActions = [],
  className,
}: WalletCardProps) => {
  const style = TONE_STYLES[tone];
  const rich = variant === 'rich';

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
      data-tone={tone}
      className={clsx(
        'lux-glass relative overflow-hidden flex flex-col rounded-2xl p-4 text-white shadow-card',
        'bg-gradient-to-br ring-1 ring-inset dark:ring-0 backdrop-blur-xl',
        style.gradient,
        style.ring,
        rich ? 'gap-4 p-5' : 'gap-3',
        onClick &&
          'cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
        className,
      )}
    >
      {/* Frosted-glass cues (light mode; dark mode gets its diagonal sheen and
          top edge from `.lux-glass`): glare band + hairline top highlight. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-4 h-56 w-14 rotate-[22deg] bg-gradient-to-b from-transparent via-white/15 to-transparent dark:hidden"
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25 dark:hidden" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{name}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
            {style.label} · {currency}
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="flex shrink-0 -mr-1.5 -mt-1.5" onClick={(event) => event.stopPropagation()}>
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                aria-label={action.label}
                title={action.label}
                onClick={action.onClick}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white active:bg-white/30 transition-colors cursor-pointer"
              >
                {action.icon}
              </button>
            ))}
          </div>
        ) : (
          <span aria-hidden className="mt-1 h-4 w-6 shrink-0 rounded bg-white/30" />
        )}
      </div>

      <p className="relative">
        <Money
          amount={balance}
          prefix={balance < 0 ? '−' : undefined}
          currency={currency}
          tone="onColor"
          className={rich ? 'text-3xl' : 'text-xl'}
        />
      </p>

      {rich && monthIncome !== undefined && monthExpense !== undefined && (
        <div className="relative grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-black/15 dark:bg-white/[0.04] dark:border dark:border-white/[0.06] px-2.5 py-1.5">
            <p className="text-white/70 dark:text-slate-400">In this month</p>
            <p className="font-bold">+{formatMoney(monthIncome, currency)}</p>
          </div>
          <div className="rounded-lg bg-black/15 dark:bg-white/[0.04] dark:border dark:border-white/[0.06] px-2.5 py-1.5">
            <p className="text-white/70 dark:text-slate-400">Out this month</p>
            <p className="font-bold">−{formatMoney(monthExpense, currency)}</p>
          </div>
        </div>
      )}

      {/* Micro progress track: how much of this wallet's spending limit is
          used. Bar shifts white -> amber -> rose as it nears/passes the
          limit (same 70/90 thresholds as Goals). */}
      <div className="relative mt-auto">
        {budget ? (
          <>
            <div className="mb-1 flex justify-between text-[11px] font-semibold text-white/85">
              <span>Budget {Math.round(budget.percent)}% used</span>
              <span>
                {formatMoney(budget.spent, currency)} / {formatMoney(budget.limit, currency)}
              </span>
            </div>
            <ProgressBar
              size="xs"
              percent={budget.percent}
              color={budgetBarColor(budget.percent)}
              trackClassName="bg-white/20"
              label={`${name} budget used`}
            />
          </>
        ) : (
          <p className="text-[11px] font-medium text-white/60">No spending limit set</p>
        )}
      </div>

      {rich && footerActions.length > 0 && (
        <div
          className="relative flex flex-wrap gap-2 border-t border-white/15 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          {footerActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 dark:bg-white/5 dark:border dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25 dark:hover:bg-white/10 active:bg-white/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletCard;
