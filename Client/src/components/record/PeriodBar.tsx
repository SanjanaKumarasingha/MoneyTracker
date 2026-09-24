import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Button, Input, SegmentedControl } from '../ui';
import {
  CustomRange,
  PeriodRange,
  PeriodScale,
  PERIOD_SCALE_LABELS,
} from '../../utils/period';

export interface PeriodBarProps {
  scale: PeriodScale;
  onScaleChange: (scale: PeriodScale) => void;
  /** Periods back (-) / forward (+) from the current one. */
  offset: number;
  onOffsetChange: (offset: number) => void;
  custom: CustomRange;
  onCustomChange: (range: CustomRange) => void;
  range: PeriodRange | null;
}

const SCALES: PeriodScale[] = ['week', 'month', 'year', 'custom', 'all'];
const OPTIONS = SCALES.map((value) => ({ value, label: PERIOD_SCALE_LABELS[value] }));

// One control for "which slice of time am I looking at". Week/Month/Year step
// with prev/next arrows (a stepper beats a calendar picker for the 95% case of
// "last month" / "this week"), Custom exposes two date fields, All time shows
// everything. Presets first, precision on demand: the fastest path is one tap.
const PeriodBar = ({
  scale,
  onScaleChange,
  offset,
  onOffsetChange,
  custom,
  onCustomChange,
  range,
}: PeriodBarProps) => {
  const steppable = scale === 'week' || scale === 'month' || scale === 'year';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Time period"
          options={OPTIONS}
          value={scale}
          onChange={(next) => {
            onScaleChange(next);
            onOffsetChange(0);
          }}
        />

        {steppable && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="!rounded-full !p-1.5"
              aria-label="Previous period"
              onClick={() => onOffsetChange(offset - 1)}
            >
              <FiChevronLeft />
            </Button>
            <span className="min-w-40 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {range?.label}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="!rounded-full !p-1.5"
              aria-label="Next period"
              disabled={offset >= 0}
              onClick={() => onOffsetChange(offset + 1)}
            >
              <FiChevronRight />
            </Button>
            {offset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => onOffsetChange(0)}>
                Today
              </Button>
            )}
          </div>
        )}

        {scale === 'all' && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Every record, no date filter</span>
        )}
      </div>

      {scale === 'custom' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label="From"
            type="date"
            value={custom.from}
            max={custom.to || undefined}
            onChange={(event) => onCustomChange({ ...custom, from: event.target.value })}
            containerClassName="sm:w-44"
          />
          <Input
            label="To"
            type="date"
            value={custom.to}
            min={custom.from || undefined}
            onChange={(event) => onCustomChange({ ...custom, to: event.target.value })}
            containerClassName="sm:w-44"
          />
          {!range && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 sm:pb-2">
              Pick both dates to apply the range.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PeriodBar;
