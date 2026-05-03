import BackButton from '../components/BackButton';
import WalletCategoryManager from '../components/category/WalletCategoryManager';
import { useRecord } from '../provider/RecordDataProvider';
import clsx from 'clsx';
import { useDarkMode } from '../provider/DarkModeProvider';

const CategoryPage = () => {
  const { favWallet } = useRecord();
  const { isDarkMode } = useDarkMode();

  return (
    <div className="dashboard-page">
      <BackButton />
      <div className="mt-4">
        <p
          className={clsx(
            'dashboard-kicker',
            isDarkMode ? 'text-white/40' : 'text-slate-500',
          )}
        >
          Categories
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {favWallet ? `${favWallet.name} Categories` : 'Categories'}
        </h1>
        <p
          className={clsx(
            'mt-2 text-sm sm:text-base',
            isDarkMode ? 'text-white/60' : 'text-slate-600',
          )}
        >
          {favWallet
            ? 'Create, edit, delete, and reorder categories for this wallet'
            : 'Select a wallet first to manage categories'}
        </p>
      </div>
      <WalletCategoryManager className="mt-3" />
    </div>
  );
};

export default CategoryPage;
