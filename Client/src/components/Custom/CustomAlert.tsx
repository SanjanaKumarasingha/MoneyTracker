import clsx from 'clsx';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { BsCheck2Circle } from 'react-icons/bs';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { GoAlert } from 'react-icons/go';

export type CustomAlertType = 'warning' | 'success' | 'error' | 'info';

type CustomAlertProps = {
  type: CustomAlertType;
  content: string;
};

const CustomAlert = ({ type, content }: CustomAlertProps) => {
  const icon = (value: CustomAlertType) => {
    switch (value) {
      case 'error':
        return <IoIosCloseCircleOutline />;
      case 'warning':
        return <GoAlert />;
      case 'success':
        return <BsCheck2Circle />;
      case 'info':
        return <AiOutlineInfoCircle />;
    }
  };

  return (
    <div
      className={clsx(
        'p-2 rounded-sm flex gap-2',
        type === 'error'
          ? 'text-red-500 bg-red-100 dark:text-red-300 dark:bg-red-950'
          : type === 'warning'
          ? 'text-primary-500 bg-primary-100 dark:text-primary-300 dark:bg-primary-950'
          : type === 'success'
          ? 'text-emerald-500 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950'
          : 'text-secondary-400 bg-secondary-100 dark:text-secondary-300 dark:bg-secondary-950',
      )}
    >
      <span className="text-2xl pt-1"> {icon(type)}</span>
      <p className="flex-1">{content}</p>
    </div>
  );
};

export default CustomAlert;
