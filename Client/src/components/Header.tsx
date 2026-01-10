import { routes } from '../routes';
import { useLocation } from 'react-router-dom';
import Setting from './Setting';
import { useMenu } from '../provider/MenuOpenProvider';
import OpenCloseIcon from './OpenCloseIcon';
import { useDarkMode } from '../hooks';

type Props = {};

const Header = (props: Props) => {
  const location = useLocation();

  const { isSideBarOpen, toggle } = useMenu();

  const { isDarkMode } = useDarkMode();

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
    <header className="flex justify-between items-center text-lg">
      <div className="flex items-center gap-2">
        <div className="sm:hidden flex items-center" onClick={toggle}>
          <OpenCloseIcon
            isOpen={isSideBarOpen}
            size={24}
            stroke={2}
            color={isDarkMode ? 'white' : 'black'}
          />
        </div>
        {header()}
      </div>
      <Setting />
    </header>
  );
};

export default Header;
