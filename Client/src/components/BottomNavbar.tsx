import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { navItems } from './Navbar';

type Props = {};

// Mobile-only bottom tab bar. Mirrors the same route list used by the
// desktop sidebar (`Navbar`) so mobile and desktop navigation never diverge.
const BottomNavbar = (props: Props) => {
  return (
    <nav
      className={clsx(
        // Same frosted-glass treatment as Header/Navbar - kept slightly
        // more opaque than those two (70% vs 60%) since content scrolls
        // directly underneath this one and needs to stay legible.
        'sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl',
        'bg-white/80 dark:bg-[#080B11]/85',
        'border-t border-zinc-200 dark:border-white/[0.07] dark:border-t-white/[0.12]',
        'text-zinc-800 dark:text-zinc-200',
      )}
    >
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
                  ? 'text-primary-600 dark:text-sky-200 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-200',
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
