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
      return 'Money Game';
    }
  };

  return (
    <header
      className={clsx(
        // Sticky slim top bar: page title on the left, account on the right.
        // Blurred so content scrolling under it stays readable.
        'sticky top-0 z-30 flex justify-between items-center px-4 sm:px-6 h-14',
        'backdrop-blur-xl bg-white/80 dark:bg-[#080B11]/70',
        'border-b border-zinc-200 dark:border-white/[0.07]',
      )}
    >
      <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {header()}
      </div>
      <Setting />
    </header>
  );
};

export default Header;
