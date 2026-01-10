import { EIconName } from '../../common/icon-name.enum';
import IconSelector from '../IconSelector';

type PercentRowProps = {
  iconName: EIconName;
  value: number;
  total: number;
};

const PercentRow = ({ iconName, value, total }: PercentRowProps) => {
  return (
    <div className="flex items-center justify-between border-b border-b-zinc300">
      <div className="flex items-center gap-3">
        <IconSelector name={iconName} />
        <div> {value.toFixed(2)}</div>
      </div>

      <div>{((value / total) * 100).toFixed(2)} %</div>
    </div>
  );
};

export default PercentRow;
