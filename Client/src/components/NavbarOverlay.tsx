import React from 'react';
import { navItems } from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../provider/MenuOpenProvider';
import OpenCloseIcon from './OpenCloseIcon';
import { useDarkMode } from '../provider/DarkModeProvider';

type Props = {};

const NavbarOverlay = (props: Props) => {
  const navigate = useNavigate();
  const { isSideBarOpen, toggle } = useMenu();
  const { isDarkMode } = useDarkMode();

  return (
    <div className="w-full h-full bg-zinc-900 bg-opacity-80">
      <div className="p-3" onClick={toggle}>
        <OpenCloseIcon
          isOpen={isSideBarOpen}
          size={24}
          color={isDarkMode ? 'white' : 'black'}
          stroke={4}
        />
      </div>

      <div
        className="text-2xl py-2 px-4 cursor-pointer w-fit text-primary-300 font-semibold"
        onClick={() => {
          navigate('/');
        }}
      >
        <p>Expense</p>
        <p>Tracker</p>
      </div>
      <div className="pt-4 text-lg flex flex-col gap-2 px-2 text-white">
        {navItems.map((item) => (
          <a
            href={item.path}
            key={item.name}
            className="flex gap-2 items-center cursor-pointer hover:bg-primary-200 active:bg-primary-100 rounded-md m-1 p-1 hover:scale-105 scale-100 transition-all duration-300 "
          >
            <span className="text-2xl">{item.icon}</span>

            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default NavbarOverlay;
