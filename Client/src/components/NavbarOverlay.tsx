import { navItems } from './Navbar';
import { NavLink } from 'react-router-dom';
import { useMenu } from '../provider/MenuOpenProvider';
import OpenCloseIcon from './OpenCloseIcon';
import { useDarkMode } from '../provider/DarkModeProvider';
import clsx from 'clsx';

type Props = {};

function NavbarOverlay(props: Props) {
  const { isSideBarOpen, toggle } = useMenu();
  const { isDarkMode } = useDarkMode();

  return (
    <div
      className={clsx(
        'flex h-full w-full flex-col backdrop-blur-xl',
        isDarkMode ? 'bg-slate-950/92 text-white' : 'bg-white/96 text-slate-900',
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className={clsx('dashboard-kicker', isDarkMode ? 'text-white/40' : 'text-slate-400')}>
            Navigation
          </p>
          <p className="mt-1 text-lg font-semibold">Money Tracker</p>
        </div>

        <button
          type="button"
          className={clsx(
            'rounded-2xl p-2',
            isDarkMode ? 'bg-white/5' : 'bg-slate-100',
          )}
          onClick={toggle}
        >
          <OpenCloseIcon
            isOpen={isSideBarOpen}
            size={24}
            color={isDarkMode ? 'white' : 'black'}
            stroke={4}
          />
        </button>
      </div>

      <div className="px-4">
        <div
          className={clsx(
            'rounded-3xl border px-4 py-4',
            isDarkMode ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50',
          )}
        >
          <p className="text-sm font-medium">Everything important, one tap away</p>
          <p className={clsx('mt-1 text-sm', isDarkMode ? 'text-white/55' : 'text-slate-500')}>
            Use the quick sections below to manage wallets, records, and charts from mobile.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-4 pt-5">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={toggle}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-base transition',
                isActive
                  ? isDarkMode
                    ? 'bg-emerald-400/14 text-emerald-100'
                    : 'bg-emerald-50 text-emerald-700'
                  : isDarkMode
                  ? 'text-white hover:bg-white/6'
                  : 'text-slate-700 hover:bg-slate-100',
              )
            }
          >
            <span className="text-2xl">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default NavbarOverlay;
