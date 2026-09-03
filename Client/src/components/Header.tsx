import { routes } from '../routes';
import { useLocation } from 'react-router-dom';
import Setting from './Setting';
import clsx from 'clsx';

type Props = {};

const Header = (props: Props) => {
  const location = useLocation();

  const header = () => {
    const authRoute = routes.authRoute.find(
      (route) => route.path === location.pathname,
    );

    if (authRoute) {
      return authRoute.name;
    } else {
      return ' Expense Tracker';
    }
  };

  return (
    <header
      className={clsx(
        // Same frosted-glass treatment as Navbar/BottomNavbar, so the three
        // pieces of chrome read as one consistent surface.
        'flex justify-between items-center rounded-2xl backdrop-blur-xl shadow-card px-4 py-3',
        'bg-white/60 dark:bg-zinc-900/50',
        'border border-white/60 dark:border-white/10',
      )}
    >
      <div className="flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        {header()}
      </div>
      <Setting />
    </header>
  );
};

export default Header;
