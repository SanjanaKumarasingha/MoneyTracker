import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { navItems } from './Navbar';
import { useDarkMode } from '../provider/DarkModeProvider';

const MobileBottomNav = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <nav
      className={clsx(
        'fixed inset-x-3 bottom-3 z-40 rounded-[26px] border px-2 py-2 shadow-2xl backdrop-blur-xl sm:hidden',
        isDarkMode
          ? 'border-white/10 bg-slate-950/88 text-white'
          : 'border-slate-200/80 bg-white/92 text-slate-900',
      )}
    >
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition',
                isActive
                  ? isDarkMode
                    ? 'bg-emerald-400/14 text-emerald-100'
                    : 'bg-emerald-50 text-emerald-700'
                  : isDarkMode
                  ? 'text-white/60'
                  : 'text-slate-500',
              )
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
