import { BsChevronRight } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

type Props = {};

const SettingPage = (props: Props) => {
  const settings = [
    {
      name: 'Manage Categories',
      path: '/categories',
    },
    {
      name: 'User Profile',
      path: '/profile',
    },
    {
      name: 'Update Password',
      path: '/update-password',
    },
  ];

  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {settings.map((setting) => (
        <div
          key={setting.path}
          className="shadow dark:shadow-primary-900 p-2 cursor-pointer flex justify-between items-center hover:bg-primary-50 active:bg-primary-100 dark:hover:bg-primary-900 dark:hover:bg-opacity-40 dark:active:bg-opacity-80"
          onClick={() => {
            navigate(setting.path);
          }}
        >
          <span>{setting.name}</span>
          <BsChevronRight />
        </div>
      ))}
    </div>
  );
};

export default SettingPage;
