import { routes } from '../routes';
import { useLocation } from 'react-router-dom';
import Setting from './Setting';

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
    <header className="flex justify-between items-center text-lg">
      <div className="flex items-center gap-2">{header()}</div>
      <Setting />
    </header>
  );
};

export default Header;
