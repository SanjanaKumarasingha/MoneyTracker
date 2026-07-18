import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { navItems } from './Navbar';

type Props = {};

// Mobile-only bottom tab bar. Mirrors the same route list used by the
// desktop sidebar (`Navbar`) so mobile and desktop navigation never diverge.
const BottomNavbar = (props: Props) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => (
          <NavLink
            to={item.path}
            end={item.path === '/'}
            key={item.name}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors duration-200',
                isActive
                  ? 'text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300',
              )
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;
