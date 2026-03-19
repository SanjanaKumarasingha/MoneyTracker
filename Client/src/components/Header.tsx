import { routes } from '../routes';
import { useLocation } from 'react-router-dom';
import Setting from './Setting';
import { useMenu } from '../provider/MenuOpenProvider';
import OpenCloseIcon from './OpenCloseIcon';
import { useDarkMode } from '../hooks';
import clsx from 'clsx';
import { DateTime } from 'luxon';

const Header = () => {
  const location = useLocation();
  const { isSideBarOpen, toggle } = useMenu();
  const { isDarkMode } = useDarkMode();

  const getHeaderTitle = () => {
    const authRoute = routes.authRoute.find(
      (route) => route.path === location.pathname,
    );

    return authRoute ? authRoute.name : 'Expense Tracker';
  };

  const glass =
    'border border-white/10 bg-white/5 backdrop-blur-xl shadow';

  return (
    <header
      className={clsx(
        glass,
        'relative z-30 flex items-center justify-between rounded-[26px] px-4 py-4 sm:px-5',
        isDarkMode
          ? 'bg-gradient-to-r from-slate-950/70 via-slate-900/60 to-slate-950/70 text-white'
          : 'border-slate-200/80 bg-white/80 text-slate-900 shadow-[0_18px_45px_rgba(148,163,184,0.15)]',
      )}
    >
      <div className="flex items-center gap-4">
        <button
          className={clsx(
            'flex items-center justify-center rounded-2xl p-2 transition-all duration-200 sm:hidden',
            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100',
          )}
          onClick={toggle}
        >
          <OpenCloseIcon
            isOpen={isSideBarOpen}
            size={22}
            stroke={2}
            color={isDarkMode ? 'white' : '#0f172a'}
          />
        </button>

        <div className="flex flex-col leading-tight">
          <span
            className={clsx(
              'dashboard-kicker',
              isDarkMode ? 'text-white/45' : 'text-slate-500',
            )}
          >
            Financial workspace
          </span>
          <span
            className={clsx(
              'text-lg font-semibold tracking-wide sm:text-[1.35rem]',
              isDarkMode ? 'text-emerald-100' : 'text-slate-900',
            )}
          >
            {getHeaderTitle()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p
            className={clsx(
              'text-xs uppercase tracking-[0.3em]',
              isDarkMode ? 'text-white/40' : 'text-slate-400',
            )}
          >
            Today
          </p>
          <p
            className={clsx(
              'text-sm font-medium',
              isDarkMode ? 'text-white/80' : 'text-slate-600',
            )}
          >
            {DateTime.now().toFormat('dd LLL yyyy')}
          </p>
        </div>
        <div
          className={clsx(
            'hidden h-8 w-px sm:block',
            isDarkMode ? 'bg-white/10' : 'bg-slate-200',
          )}
        />
        <Setting />
      </div>
    </header>
  );
};

export default Header;
