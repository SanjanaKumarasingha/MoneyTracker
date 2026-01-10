import clsx from 'clsx';

type CustomSwitchProps = {
  on: boolean;
  toggle: () => void;
  enableColor?: `peer-checked:${string}`;
  disableColor?: string;
  size?: number;
};

const CustomSwitch = ({
  on,
  toggle,
  enableColor,
  disableColor,
  size,
}: CustomSwitchProps) => {
  const enableColorReg = /(peer-checked:bg-)(\w+)/g;
  const disableColorReg = /(bg-)(\w+)/g;
  return (
    <label className="hidden xs:flex relative cursor-pointer rounded-full">
      <input
        type="checkbox"
        className="sr-only peer hidden"
        checked={on}
        onChange={toggle}
      />
      <div
        className={clsx(
          'block rounded-full',
          enableColorReg.test(enableColor ?? '')
            ? enableColor
            : 'peer-checked:bg-primary-500',
          disableColorReg.test(disableColor ?? '')
            ? disableColor
            : 'bg-zinc-200',
        )}
        style={{
          width: size ? (size / 3) * 7 : 56,
          height: size ? (size / 3) * 4 : 32,
        }}
      ></div>
      <div
        className={clsx(
          'absolute rounded-full peer-checked:invisible peer-checked:translate-x-full transition-all bg-white',
        )}
        style={{
          width: size ?? 24,
          height: size ?? 24,
          top: size ? size / 6 : 4,
          left: size ? size / 6 : 4,
        }}
      />
      <div
        className={clsx(
          'absolute rounded-full invisible peer-checked:visible peer-checked:translate-x-full transition-all bg-white',
        )}
        style={{
          width: size ?? 24,
          height: size ?? 24,
          top: size ? size / 6 : 4,
          left: size ? size / 6 : 4,
        }}
      />
    </label>
  );
};

export default CustomSwitch;
