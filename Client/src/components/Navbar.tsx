import { ReactElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';
import { HiOutlineWallet } from 'react-icons/hi2';
import { AiOutlineBarChart } from 'react-icons/ai';
import { TbReportSearch } from 'react-icons/tb';
import clsx from 'clsx';
type Props = {};

interface INavItem {
  name: string;
  icon: ReactElement;
  path: string;
}

export const navItems: INavItem[] = [
  {
    name: 'Home',
    icon: <HiOutlineHome strokeWidth="1" />,
    path: '/',
  },
  {
    name: 'Chart',
    icon: <AiOutlineBarChart strokeWidth="1" />,
    path: '/charts',
  },
  {
    name: 'Wallets',
    icon: <HiOutlineWallet strokeWidth="1" />,
    path: '/wallets',
  },
  {
    name: 'Records',
    icon: <TbReportSearch strokeWidth="1" />,
    path: '/records',
  },
];

const Navbar = (props: Props) => {
  const navigate = useNavigate();
  return (
    <div
      className={clsx(
        // Frosted glass panel: translucent + blurred instead of a flat
        // opaque card, so it reads as sitting "above" the page rather than
        // as just another bordered box (see the ambient color blobs in
        // Layout.tsx, which this blurs).
        'h-full rounded-2xl backdrop-blur-xl shadow-card',
        'bg-white/60 dark:bg-zinc-900/50',
        'border border-white/60 dark:border-white/10',
        'text-zinc-800 dark:text-zinc-100',
      )}
    >
      <div
        className="text-2xl py-4 px-4 cursor-pointer w-fit"
        onClick={() => {
          navigate('/');
        }}
      >
        <p>Expense</p>
        <p className="text-primary-600 dark:text-primary-400">Tracker</p>
      </div>
      <div className="pt-2 pb-2 text-lg flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            to={item.path}
            end={item.path === '/'}
            key={item.name}
            className={({ isActive }) =>
              clsx(
                'flex gap-2 items-center rounded-xl px-3 py-2 border transition-colors duration-200',
                isActive
                  ? 'bg-primary-500/15 dark:bg-primary-400/15 border-primary-400/30 dark:border-primary-400/20 text-primary-700 dark:text-primary-300 font-semibold'
                  : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-white/5 hover:border-white/50 dark:hover:border-white/10 active:bg-white/70 dark:active:bg-white/10',
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

export default Navbar;
