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
  return (
    <aside
      className={clsx(
        'dashboard-panel sticky top-3 h-full overflow-hidden text-white/90',
        'bg-gradient-to-b from-slate-950/78 via-slate-950/52 to-slate-950/78',
      )}
    >
      <NavLink
        to="/"
        className="block rounded-[24px] px-5 py-5 select-none focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/15">
            <div className="h-4 w-4 rounded-[6px] bg-gradient-to-br from-emerald-300 to-cyan-300 shadow-[0_0_18px_rgba(52,211,153,0.45)]" />
          </div>

          <div className="leading-tight">
            <p className="dashboard-kicker text-white/40">Money Tracker</p>
            <p className="text-lg font-semibold tracking-wide text-white">
              Finance OS
            </p>
          </div>
        </div>
      </NavLink>

      <div className="mx-5 mb-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
        <p className="text-sm font-medium text-white/75">Track spending with structure</p>
        <p className="mt-1 text-xs leading-5 text-white/45">
          Keep wallets, records, and reporting aligned in one place.
        </p>
      </div>

      <nav className="px-3 pb-4">
        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200',
                  'border border-transparent',
                  'hover:bg-white/10 hover:border-white/10',
                  'active:scale-[0.99]',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-400/18 to-cyan-400/12 border-emerald-300/20 text-emerald-50 shadow-[0_16px_35px_rgba(16,185,129,0.12)]'
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

              <span
                className={clsx(
                  'ml-auto h-2 w-2 rounded-full transition-opacity duration-200',
                  'bg-emerald-300/70',
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
