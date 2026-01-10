import clsx from 'clsx';

type CategorySelectorProps = {
  options: string[];
  value: string;
  toggle: (type: string) => void;
  color?: {
    selected: string;
    background: string;
  };
};

const CategorySelector = ({
  options,
  toggle,
  value,
  color,
}: CategorySelectorProps) => {
  return (
    <div
      className="grid text-center w-full bg-primary-100 dark:bg-primary-800 rounded-md p-2 relative shadow"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        background: color?.background,
      }}
    >
      <div
        className={clsx(
          'absolute bg-primary-200 dark:bg-primary-600  h-full rounded-md shadow transition-all',
        )}
        style={{
          backgroundColor: color?.selected,
          width: `${(1 / options.length) * 100 ?? 100}%`,
          transform: `translateX(${
            options.findIndex((option) => option === value) * 100 ?? 0
          }%)`,
        }}
      ></div>
      {options.map((option) => (
        <div
          key={option}
          className="z-10 cursor-pointer"
          onClick={() => {
            toggle(option);
          }}
        >
          {option}
        </div>
      ))}
    </div>
  );
};

export default CategorySelector;
