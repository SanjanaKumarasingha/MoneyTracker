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
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 h-full">
      <div
        className="text-2xl py-2 px-4 cursor-pointer w-fit text-zinc-900 dark:text-zinc-100"
        onClick={() => {
          navigate('/');
        }}
      >
        <p>Expense</p>
        <p>Tracker</p>
      </div>
      <div className="pt-4 text-lg flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <NavLink
            to={item.path}
            end={item.path === '/'}
            key={item.name}
            className={({ isActive }) =>
              clsx(
                'flex gap-2 items-center cursor-pointer rounded-md m-1 p-1 hover:scale-105 scale-100 transition-all duration-300',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-700 dark:active:bg-zinc-600',
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
