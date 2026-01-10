import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';
import { HiOutlineWallet } from 'react-icons/hi2';
import { AiOutlineBarChart } from 'react-icons/ai';
import { TbReportSearch } from 'react-icons/tb';
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
    <div className="bg-secondary-300 dark:bg-secondary-700 rounded-md text-secondary-800 dark:text-secondary-200 h-full">
      <div
        className="text-2xl py-2 px-4 cursor-pointer w-fit"
        onClick={() => {
          navigate('/');
        }}
      >
        <p>Expense</p>
        <p>Tracker</p>
      </div>
      <div className="pt-4 text-lg flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <a
            href={item.path}
            key={item.name}
            className="flex gap-2 items-center cursor-pointer hover:bg-secondary-200 active:bg-secondary-100 dark:hover:bg-secondary-600 dark:active:bg-secondary-500 rounded-md m-1 p-1 hover:scale-105 scale-100 transition-all duration-300 "
          >
            <span className="text-2xl">{item.icon}</span>

            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
