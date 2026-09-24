import clsx from 'clsx';

// 'onColor*' tones are for figures sitting on a saturated/dark fill (hero,
// wallet cards) that stays dark-backed in light mode too.
export type MoneyTone =
  | 'default'
  | 'positive'
  | 'negative'
  | 'onColor'
  | 'onColorPositive'
  | 'onColorNegative';

export interface MoneyProps {
  /** Rendered as an absolute value - pass `prefix` for a sign. */
  amount: number;
  currency?: string;
  /** Leading sign/marker, e.g. '+' or '−', shown before the currency label. */
  prefix?: string;
  tone?: MoneyTone;
  /** Tailwind text-size class for the integer part; decimals scale from it. */
  className?: string;
  /** Replace the figure with dots (privacy toggle). */
  masked?: boolean;
}

const INTEGER_TONE: Record<MoneyTone, string> = {
  default: 'text-zinc-900 dark:text-white',
  positive: 'text-emerald-600 dark:text-emerald-300',
  negative: 'text-rose-600 dark:text-rose-300',
  onColor: 'text-white',
  onColorPositive: 'text-emerald-200 dark:text-emerald-300',
  onColorNegative: 'text-rose-200 dark:text-rose-300',
};

const MUTED_TONE: Record<MoneyTone, string> = {
  default: 'text-zinc-500 dark:text-slate-400',
  positive: 'text-emerald-600/70 dark:text-emerald-300/60',
  negative: 'text-rose-600/70 dark:text-rose-300/60',
  onColor: 'text-white/70 dark:text-slate-400',
  onColorPositive: 'text-emerald-200/70 dark:text-emerald-300/60',
  onColorNegative: 'text-rose-200/70 dark:text-rose-300/60',
};

// Typographic hierarchy for a money figure: small uppercase tracked currency
// code, large tabular integer, muted decimals - so the eye lands on the
// whole-number magnitude first. Splits the same Intl formatting formatMoney
// uses (currencyDisplay 'code' so it reads "LKR", not "Rs"), so grouping and
// decimal rules per currency stay correct (e.g. JPY has no decimals).
const Money = ({ amount, currency, prefix, tone = 'default', className, masked }: MoneyProps) => {
  const code = (currency || 'USD').toUpperCase();

  let label = code;
  let integer = '';
  let fraction = '';

  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
    }).formatToParts(Math.abs(amount));
    label = parts.find((p) => p.type === 'currency')?.value ?? code;
    integer = parts
      .filter((p) => p.type === 'integer' || p.type === 'group')
      .map((p) => p.value)
      .join('');
    fraction = parts.find((p) => p.type === 'fraction')?.value ?? '';
  } catch {
    const [int, frac] = Math.abs(amount).toFixed(2).split('.');
    integer = int;
    fraction = frac;
  }

  return (
    <span className={clsx('whitespace-nowrap', className)}>
      {prefix && <span className={clsx('font-bold mr-1', INTEGER_TONE[tone])}>{prefix}</span>}
      <span
        className={clsx(
          'text-xs tracking-wider font-semibold uppercase mr-1.5 align-baseline',
          MUTED_TONE[tone],
        )}
      >
        {label}
      </span>
      <span className={clsx('font-bold tracking-tight tabular-nums', INTEGER_TONE[tone])}>
        {masked ? '••••' : integer}
      </span>
      {!masked && fraction && (
        <span
          className={clsx('font-medium tabular-nums', MUTED_TONE[tone])}
          style={{ fontSize: 'max(0.875rem, 0.55em)' }}
        >
          .{fraction}
        </span>
      )}
    </span>
  );
};

export default Money;
