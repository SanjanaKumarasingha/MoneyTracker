import { routes } from '../routes';
import { useLocation } from 'react-router-dom';
import Setting from './Setting';
import { useMenu } from '../provider/MenuOpenProvider';
import OpenCloseIcon from './OpenCloseIcon';
import { useDarkMode } from '../hooks';
import clsx from 'clsx';

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
        'rounded-2xl px-5 py-3 flex justify-between items-center',
        // dark navy gradient background
        'bg-gradient-to-r from-slate-950/70 via-slate-900/60 to-slate-950/70',
        'text-white',
      )}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        {/* Sidebar toggle (mobile only) */}
        <button
          className="sm:hidden flex items-center justify-center p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
          onClick={toggle}
        >
          <OpenCloseIcon
            isOpen={isSideBarOpen}
            size={22}
            stroke={2}
            color="white"
          />
        </button>

        {/* Page Title */}
        <div className="flex flex-col leading-tight">
          <span className="text-sm text-white/50 tracking-wide uppercase">
            Dashboard
          </span>
          <span className="text-lg font-semibold tracking-wide text-emerald-100">
            {getHeaderTitle()}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block h-6 w-px bg-white/10" />
        <Setting />
      </div>
    </header>
  );
};

export default Header;