import React from 'react';
import { PiMoonStarsThin, PiSunThin } from 'react-icons/pi';
import { useDarkMode } from '../provider/DarkModeProvider';
import { clsx } from 'clsx';

type Props = {};

const Footer = (props: Props) => {
  const { enable, disable, isDarkMode } = useDarkMode();
  return (
    <div className="p-1 text-right flex justify-end gap-2 text-xl">
      <div
        className={clsx(
          'p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full cursor-pointer',
          isDarkMode ? 'text-zinc-400' : 'text-amber-400',
        )}
        onClick={() => disable()}
      >
        <PiSunThin />
      </div>
      <div
        className={clsx(
          'p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full cursor-pointer',
          isDarkMode ? 'text-indigo-300' : 'text-zinc-500',
        )}
        onClick={() => enable()}
      >
        <PiMoonStarsThin />
      </div>
    </div>
  );
};

export default Footer;
