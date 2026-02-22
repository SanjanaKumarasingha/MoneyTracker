import { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';
import { HiOutlineWallet } from 'react-icons/hi2';
import { AiOutlineBarChart } from 'react-icons/ai';
import { TbReportSearch } from 'react-icons/tb';
import clsx from 'clsx';

interface INavItem {
  name: string;
  icon: ReactElement;
  path: string;
}

export const navItems: INavItem[] = [
  { name: 'Home', icon: <HiOutlineHome strokeWidth="1" />, path: '/' },
  { name: 'Chart', icon: <AiOutlineBarChart strokeWidth="1" />, path: '/charts' },
  { name: 'Wallets', icon: <HiOutlineWallet strokeWidth="1" />, path: '/wallets' },
  { name: 'Records', icon: <TbReportSearch strokeWidth="1" />, path: '/records' },
];

function Navbar() {
  const glass =
    'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow';

  return (
    <aside
      className={clsx(
        glass,
        'h-full text-white/90',
        // deep navy base glow
        'bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/70',
      )}
    >
      {/* Brand */}
      <NavLink
        to="/"
        className="block px-6 py-5 select-none focus:outline-none focus:ring-2 focus:ring-emerald-400/40 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          {/* Logo dot */}
          <div className="h-9 w-9 rounded-xl bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-emerald-300/70" />
          </div>

          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-wide">Expense</p>
            <p className="text-lg font-semibold tracking-wide text-emerald-100/90">
              Tracker
            </p>
          </div>
        </div>
      </NavLink>

      {/* Menu */}
      <nav className="px-3 pb-4">
        {/* <p className="px-3 pt-2 pb-2 text-xs uppercase tracking-widest text-white/50">
          Menu
        </p> */}

        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200',
                  'border border-transparent',
                  'hover:bg-white/10 hover:border-white/10',
                  'active:scale-[0.99]',
                  isActive
                    ? 'bg-emerald-400/15 border-emerald-300/20 text-emerald-50'
                    : 'text-white/80',
                )
              }
            >
              <span
                className={clsx(
                  'text-2xl flex items-center justify-center',
                  'transition-transform duration-200',
                  'group-hover:scale-105',
                )}
              >
                {item.icon}
              </span>

              <span className="text-sm font-medium">{item.name}</span>

              {/* Active indicator */}
              <span
                className={clsx(
                  'ml-auto h-2 w-2 rounded-full transition-opacity duration-200',
                  'bg-emerald-300/70',
                  // visible only on active link
                  'opacity-0 group-[.active]:opacity-100',
                )}
              />
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}

export default Navbar;