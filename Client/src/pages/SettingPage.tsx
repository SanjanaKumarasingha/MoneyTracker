import { BsChevronRight } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui';

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
        <Card key={setting.path} padding="none">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between rounded-md px-4 py-3"
            onClick={() => {
              navigate(setting.path);
            }}
          >
            <span>{setting.name}</span>
            <BsChevronRight />
          </Button>
        </Card>
      ))}

      <Card padding="none">
        <Button
          type="button"
          variant="danger"
          disabled
          title="Account deletion is coming soon"
          className="w-full justify-between rounded-md px-4 py-3"
        >
          <span className="flex items-center gap-2">
            Delete Account
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium">
              Coming soon
            </span>
          </span>
          <BsChevronRight />
        </Button>
      </Card>
    </div>
  );
};

export default SettingPage;
