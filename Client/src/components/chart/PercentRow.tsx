import clsx from 'clsx';
import { EIconName } from '../../common/icon-name.enum';
import IconSelector from '../IconSelector';

type PercentRowProps = {
  name: string;
  iconName: EIconName;
  value: number;
  total: number;
  /** Category identity color (see utils/categoryColor.ts) - tints the icon
   * chip so this row's color matches its slice in the doughnut above. */
  color?: string;
  onClick?: () => void;
};

const PercentRow = ({ name, iconName, value, total, color, onClick }: PercentRowProps) => {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick();
      }}
      className={clsx(
        'flex items-center justify-between gap-2 border-b border-b-zinc-100 dark:border-b-zinc-700 py-1.5',
        onClick && 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md -mx-1 px-1',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="flex items-center justify-center rounded-full p-1.5 text-white text-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          <IconSelector name={iconName} />
        </div>
        <span className="text-sm truncate">{name}</span>
      </div>

      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-sm font-medium">{value.toFixed(2)}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {((value / total) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default PercentRow;
