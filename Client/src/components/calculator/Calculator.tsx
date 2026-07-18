import clsx from 'clsx';

type CalculatorProps = {
  callback: (value: string) => void;
};

const Calculator = ({ callback }: CalculatorProps) => {
  const keyboardKey = [
    ['AC', 'DE', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 rounded-md p-2">
        {keyboardKey.flat().map((key, index) => (
          <button
            key={index}
            className={clsx(
              'bg-zinc-100 rounded-md py-2 hover:bg-zinc-200 active:bg-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:active:bg-zinc-500',
              {
                'col-span-2': key === 'AC' || key === '=',
              },
            )}
            onClick={() => {
              callback(key);
            }}
            type="button"
          >
            {key === '*' ? 'x' : key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;
