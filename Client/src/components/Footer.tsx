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
        className={clsx('p-1 hover:bg-zinc-100 rounded-full cursor-pointer', {
          'text-amber-400': !isDarkMode,
        })}
        onClick={() => disable()}
      >
        <PiSunThin />
      </div>
      <div
        className={clsx('p-1 hover:bg-zinc-100 rounded-full cursor-pointer', {
          'text-indigo-300': isDarkMode,
        })}
        onClick={() => enable()}
      >
        <PiMoonStarsThin />
      </div>
    </div>
  );
};

export default Footer;
