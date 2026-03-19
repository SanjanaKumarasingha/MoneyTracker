import BackButton from '../components/BackButton';
import WalletCategoryManager from '../components/category/WalletCategoryManager';
import { useRecord } from '../provider/RecordDataProvider';

const CategoryPage = () => {
  const { favWallet } = useRecord();

  return (
    <div>
      <BackButton />
      <div className="mt-3">
        <h1 className="text-2xl font-semibold">
          {favWallet ? `${favWallet.name} Categories` : 'Categories'}
        </h1>
        <p className="text-sm text-white/60">
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
