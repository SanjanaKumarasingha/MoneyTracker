import { Category } from '../categories/entities/category.entity';
import { CategoryType, IconName } from '../enums';
import { Record } from './entities/record.entity';

// A transfer Record (see Record.isTransfer) has no real Category — it's not
// spending or earning, just money moving between two of the user's own
// wallets. This attaches a display-only, never-persisted Category-shaped
// object so every existing render/balance codepath that reads
// `record.category.{name,icon,type}` (Records.tsx, RecordDataProvider,
// Mobile's getWalletBalance, ...) keeps working unmodified. 'out' reads as
// an expense (decreases the source wallet), 'in' as income (increases the
// destination wallet) — exactly mirroring a real expense/income category's
// effect on the derived wallet balance.
//
// Plain function (not a service method) so both RecordsService and
// WalletsService — which don't otherwise depend on each other — can use it
// without introducing a circular module dependency.
export function attachTransferCategory(record: Record): Record {
  if (record.isTransfer && !record.category) {
    record.category = new Category({
      id: 0,
      name: 'Transfer',
      icon: IconName.EXCHANGE,
      enable: true,
      type:
        record.transferDirection === 'out'
          ? CategoryType.EXPENSE
          : CategoryType.INCOME,
    });
  }
  return record;
}

export function attachTransferCategories(records: Record[]): Record[] {
  return records.map((record) => attachTransferCategory(record));
}
