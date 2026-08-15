import { ReactNode, useRef } from 'react';
import clsx from 'clsx';
import { formatMoney } from '../../utils';

// Mirrors Mobile's Home wallet carousel (Mobile/app/(app)/(tabs)/index.tsx,
// CARD_GRADIENTS) - each wallet gets a distinct gradient, cycling by
// position, so a row of wallets reads like a stack of distinct bank cards
// rather than identical gray boxes. Same hex pairs as Mobile for parity.
const CARD_GRADIENTS: [string, string][] = [
  ['#3b82f6', '#1e3a8a'], // blue/navy (Mobile's hero gradient)
  ['#34d399', '#047857'], // green/dark-green
  ['#fb923c', '#9a3412'], // orange/burnt-orange
  ['#f472b6', '#9d174d'], // pink/magenta
];

// Single shared width for every WalletCard usage (Home's carousel,
// WalletPage's list) - these previously disagreed (200px vs 190px) with no
// shared source of truth.
export const WALLET_CARD_WIDTH_CLASS = 'w-[190px]';

export type WalletCardAction = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

export interface WalletCardProps {
  name: string;
  currency: string;
  balance: number;
  index?: number;
  onClick?: () => void;
  actions?: WalletCardAction[];
  className?: string;
}

const WalletCard = ({
  name,
  currency,
  balance,
  index = 0,
  onClick,
  actions = [],
  className,
}: WalletCardProps) => {
  // Icon-button clicks inside the card (edit/delete/manage-categories/
  // download) must not also trigger the card's own onClick — same
  // ref-exclusion pattern WalletPage.tsx already used before this
  // component existed.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [from, to] = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={(event) => {
        if (
          onClick &&
          (!actionsRef.current || !actionsRef.current.contains(event.target as Node))
        ) {
          onClick();
        }
      }}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick();
      }}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      className={clsx(
        'relative flex flex-col gap-3 rounded-2xl shadow-card p-4 text-white transition-transform duration-300',
        onClick && 'cursor-pointer hover:scale-[1.03]',
        className,
      )}
    >
      {actions.length > 0 && (
        <div ref={actionsRef} className="absolute right-2 top-2 flex">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              aria-label={action.label}
              title={action.label}
              onClick={action.onClick}
              className="rounded-full p-1.5 text-white/85 hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pr-6">
        <span className="font-bold truncate">{name}</span>
        {/* Small translucent "chip" rectangle - evokes a physical card's
            chip, mirrors Mobile's walletCardChip. */}
        <span className="shrink-0 w-6 h-4 rounded bg-white/30" />
      </div>

      <div>
        <div className="text-lg font-extrabold tracking-tight">
          {formatMoney(balance, currency)}
        </div>
        <div className="text-xs font-semibold text-white/80 mt-0.5">
          {currency}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
