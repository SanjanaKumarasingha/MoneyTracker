import { BsChevronRight } from 'react-icons/bs';
import { PiLockThin, PiTagThin, PiTrashThin } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profile } from '../apis';
import { IUserInfo } from '../types';
import { useAuth } from '../provider/AuthProvider';
import { Button, Card, Skeleton } from '../components/ui';

type Props = {};

// Grouped into "Preferences" / "About" with a profile summary up top,
// mirroring Mobile's settings screen (Mobile/app/(app)/(tabs)/settings/index.tsx)
// - this page used to be a flat, unlabeled list of chevron rows with no
// icons and no sense of what belonged together.
const preferenceItems = [
  { name: 'Manage Categories', path: '/categories', icon: PiTagThin },
  { name: 'Update Password', path: '/update-password', icon: PiLockThin },
];

const SettingPage = (props: Props) => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const { data: user, isLoading: isProfileLoading } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile, categories, and account.
        </p>
      </div>

      {isProfileLoading ? (
        <Skeleton className="h-16 w-full rounded-2xl" />
      ) : (
        <Card padding="none">
          <Button
            type="button"
            variant="ghost"
            className="w-full items-center justify-between gap-3 rounded-md px-4 py-3"
            onClick={() => navigate('/profile')}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-base font-semibold text-white">
                {(user?.username ?? '?').charAt(0).toUpperCase()}
              </span>
              <span className="flex flex-col items-start text-left">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {user?.username ?? '—'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user?.email ?? ''}
                </span>
              </span>
            </span>
            <BsChevronRight className="shrink-0 text-zinc-400" />
          </Button>
        </Card>
      )}

      <div className="space-y-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Preferences
        </p>
        <div className="space-y-2">
          {preferenceItems.map((item) => (
            <Card key={item.path} padding="none">
              <Button
                type="button"
                variant="ghost"
                className="w-full items-center justify-between rounded-md px-4 py-3"
                onClick={() => navigate(item.path)}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="text-lg text-zinc-500 dark:text-zinc-400" />
                  <span>{item.name}</span>
                </span>
                <BsChevronRight className="shrink-0 text-zinc-400" />
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          About
        </p>
        <Card padding="none">
          <Button
            type="button"
            variant="danger"
            disabled
            title="Account deletion is coming soon"
            className="w-full items-center justify-between rounded-md px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <PiTrashThin className="text-lg" />
              <span className="flex items-center gap-2">
                Delete Account
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium">
                  Coming soon
                </span>
              </span>
            </span>
            <BsChevronRight className="shrink-0" />
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default SettingPage;
