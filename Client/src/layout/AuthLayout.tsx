import { Navigate, Outlet } from 'react-router-dom';

import Layout from './Layout';

import { Axios } from '../apis';
import { useAuth } from '../provider/AuthProvider';

type Props = {};

const AuthLayout = (props: Props) => {
  const { authorized, isSignedIn } = useAuth();

  if (!isSignedIn || !authorized) {
    return <Navigate to={'/login'} />;
  }

  if (sessionStorage.getItem('access_token') !== '') {
    //set default Authorization header for all requests
    Axios.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${sessionStorage.getItem('access_token')}`;
  }

  return (
    <Layout mode="dashboard">
      <Outlet />
    </Layout>
  );
};

export default AuthLayout;
