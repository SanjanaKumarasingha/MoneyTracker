import clsx from 'clsx';

export interface PercentRingProps {
  percent: number;
  /** Stroke color (CSS color). */
  color: string;
  size?: number;
  className?: string;
}

// Small SVG progress ring with the rounded percent centered - the budget
// row's at-a-glance "how full is this limit" badge (Mobile: PercentRing).
const PercentRing = ({ percent, color, size = 44, className }: PercentRingProps) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={clsx('relative shrink-0', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(percent)}% used`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-zinc-800 dark:text-zinc-100">
        {Math.round(percent)}%
      </span>
    </div>
  );
};

export default PercentRing;
