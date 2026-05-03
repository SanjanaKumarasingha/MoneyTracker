import React from 'react';
import { BsChevronLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useDarkMode } from '../provider/DarkModeProvider';

type BackButtonProps = {
  text?: string;
};

const BackButton = ({ text }: BackButtonProps) => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  return (
    <button
      type="button"
      className={clsx(
        'dashboard-chip text-sm',
        isDarkMode ? 'text-white/80' : 'text-slate-700',
      )}
      onClick={() => {
        navigate(-1);
      }}
    >
      <span
        className={clsx(
          'inline-flex h-6 w-6 items-center justify-center rounded-full',
          isDarkMode ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-700',
        )}
      >
        <BsChevronLeft />
      </span>
      <span>Back {text && `to ${text}`}</span>
    </button>
  );
};

export default BackButton;
