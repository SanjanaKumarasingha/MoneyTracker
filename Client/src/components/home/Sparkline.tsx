import { useId } from 'react';

export interface SparklineProps {
  values: number[];
  className?: string;
  /** Stroke/fill color; defaults to currentColor. */
  color?: string;
  /**
   * Luminous emerald -> cyan gradient stroke with a soft glow and a smooth
   * fade-out area beneath it (overrides `color`).
   */
  luminous?: boolean;
}

// Dependency-free SVG area sparkline - a 30-point trend doesn't justify
// spinning up a chart.js canvas, and this scales crisply to any width.
const Sparkline = ({ values, className, color = 'currentColor', luminous = false }: SparklineProps) => {
  const gradientId = useId();
  const strokeId = useId();
  const width = 300;
  const height = 72;
  const pad = 4;

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  // Horizontal-tangent cubic between neighbours: smooth, and never overshoots
  // the data the way a Catmull-Rom spline can on a flat-then-jump series.
  const line = points
    .map(([x, y], i) => {
      if (i === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
      const [px, py] = points[i - 1];
      const mx = ((px + x) / 2).toFixed(1);
      return `C${mx} ${py.toFixed(1)} ${mx} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={luminous ? { filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))', overflow: 'visible' } : undefined}
      role="img"
      aria-label="Net worth over the last 30 days"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={luminous ? '#38bdf8' : color} stopOpacity={luminous ? 0.28 : 0.35} />
          <stop offset="100%" stopColor={luminous ? '#34d399' : color} stopOpacity="0" />
        </linearGradient>
        {luminous && (
          <linearGradient id={strokeId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        )}
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={luminous ? `url(#${strokeId})` : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={luminous ? '#7dd3fc' : color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export default Sparkline;
