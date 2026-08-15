import { Navigate, Outlet } from 'react-router-dom';

import Layout from './Layout';

import { Axios } from '../apis';
import { useAuth } from '../provider/AuthProvider';

type Props = {};

const AuthLayout = (props: Props) => {
  const { authorized, isSignedIn, isInitializing } = useAuth();

  // On a hard reload/direct link, AuthProvider hasn't finished checking the
  // stored token on the very first render yet - render nothing rather than
  // redirecting, or a real session gets bounced to /login (and often onward
  // to / from there) before the check completes.
  if (isInitializing) {
    return null;
  }

  if (!isSignedIn || !authorized) {
    return <Navigate to={'/login'} />;
  }

  const storedToken = sessionStorage.getItem('access_token');
  if (storedToken) {
    //set default Authorization header for all requests
    Axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  }

  return (
    <Layout mode="dashboard">
      <Outlet />
    </Layout>
  );
};

export default AuthLayout;
