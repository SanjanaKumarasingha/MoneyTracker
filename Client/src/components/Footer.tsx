import React from 'react';
import { PiMoonStarsThin, PiSunThin } from 'react-icons/pi';
import { useDarkMode } from '../provider/DarkModeProvider';
import { clsx } from 'clsx';

type Props = {};

const Footer = (props: Props) => {
  const { enable, disable, isDarkMode } = useDarkMode();
  return (
    <footer className="dashboard-panel flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p
          className={clsx(
            'dashboard-kicker',
            isDarkMode ? 'text-white/35' : 'text-slate-500',
          )}
        >
          Workspace
        </p>
        <p
          className={clsx(
            'text-sm',
            isDarkMode ? 'text-white/70' : 'text-slate-600',
          )}
        >
          Cleaner dashboard chrome, ready for future modules.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xl">
        <button
          type="button"
          className={clsx(
            'rounded-2xl p-2 transition',
            !isDarkMode
              ? 'bg-amber-400/15 text-amber-400'
              : 'text-white/55 hover:bg-white/8',
          )}
          onClick={() => disable()}
          aria-label="Enable light mode"
        >
          <PiSunThin />
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-2xl p-2 transition',
            isDarkMode
              ? 'bg-cyan-400/15 text-cyan-200'
              : 'text-slate-500 hover:bg-slate-100',
          )}
          onClick={() => enable()}
          aria-label="Enable dark mode"
        >
          <PiMoonStarsThin />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
