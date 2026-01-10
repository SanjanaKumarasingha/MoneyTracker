import { useAppDispatch, useAppSelector } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/userSlice';
import { FaUserCircle } from 'react-icons/fa';
type Props = {};

const Setting = (props: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isSignedIn } = useAppSelector((state) => state.user);
  return (
    <div className="float-right relative">
      {isSignedIn ? (
        <>
          <FaUserCircle
            strokeWidth={1}
            className="cursor-pointer hover:bg-zinc-100 rounded-full peer text-zinc-600 dark:text-zinc-400 text-2xl"
          />
          <ul className="hidden peer-hover:block bg-white absolute float-right top-0 right-0 z-10 hover:block rounded-md shadow dark:text-zinc-800">
            <li
              className="px-3 py-2 rounded-t-md cursor-pointer hover:bg-zinc-200 active:bg-zinc-100"
              onClick={() => {
                navigate('/settings');
              }}
            >
              Setting
            </li>
            <li
              className="px-3 py-2 rounded-b-md cursor-pointer hover:bg-zinc-200 active:bg-zinc-100"
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
            >
              Logout
            </li>
          </ul>
        </>
      ) : (
        <button
          onClick={() => {
            navigate('/login');
          }}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Setting;
