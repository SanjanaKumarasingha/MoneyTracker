import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import DataGrid, { Column, RenderCellProps, RenderEditCellProps, RowsChangeData } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { AiOutlineLeft, AiOutlineRight, AiOutlineDelete } from 'react-icons/ai';

import { fetchCategories } from '../../apis/category';
import { createRecord, deleteRecord, updateRecord } from '../../apis/record';
import { ICategory, ICreateRecord, IWalletRecordWithCategory } from '../../types';
import { getCategoryColor } from '../../utils/categoryColor';
import { Button, ConfirmDialog } from '../ui';

type SheetRow = {
  // 0 means "not saved yet" - the always-present blank row at the bottom.
  id: number;
  date: string;
  walletId: number | null;
  categoryId: number | null;
  remarks: string;
  price: number;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number);
  const total = year * 12 + (mon - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMon = (total % 12) + 1;
  return `${nextYear}-${String(nextMon).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
}

const makeBlankRow = (walletId: number | null): SheetRow => ({
  id: 0,
  date: new Date().toISOString().slice(0, 10),
  walletId,
  categoryId: null,
  remarks: '',
  price: 0,
});

const buildRows = (
  wallets: IWalletRecordWithCategory[],
  month: string,
  activeTab: number | 'all',
  defaultWalletId: number | null,
): SheetRow[] => {
  const saved = wallets
    .filter((wallet) => activeTab === 'all' || wallet.id === activeTab)
    .flatMap((wallet) =>
      (wallet.records ?? [])
        // Transfers are a matched pair with no real category of their own -
        // editing/deleting one side here would desync it from its other
        // half (same rule the modal-based edit flow already follows), so
        // they're left out of the directly-editable sheet.
        .filter((record) => !record.isTransfer)
        .map((record) => ({
          id: record.id,
          date: record.date,
          walletId: wallet.id,
          categoryId: record.category?.id ?? null,
          remarks: record.remarks ?? '',
          price: Number(record.price),
        })),
    )
    .filter((row) => row.date.slice(0, 7) === month)
    .sort((a, b) => a.date.localeCompare(b.date));

  const blankWalletId = activeTab === 'all' ? defaultWalletId : activeTab;
  return [...saved, makeBlankRow(blankWalletId)];
};

function WalletEditor({
  row,
  onRowChange,
  wallets,
}: RenderEditCellProps<SheetRow> & { wallets: IWalletRecordWithCategory[] }) {
  return (
    <select
      autoFocus
      className="w-full h-full px-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
      value={row.walletId ?? ''}
      onChange={(e) => {
        const walletId = e.target.value ? Number(e.target.value) : null;
        onRowChange({ ...row, walletId }, true);
      }}
    >
      {wallets.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} ({w.currency})
        </option>
      ))}
    </select>
  );
}

function CategoryEditor({
  row,
  onRowChange,
  categories,
}: RenderEditCellProps<SheetRow> & { categories: ICategory[] }) {
  const expense = categories.filter((c) => c.type === 'expense');
  const income = categories.filter((c) => c.type === 'income');

  return (
    <select
      autoFocus
      className="w-full h-full px-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
      value={row.categoryId ?? ''}
      onChange={(e) => {
        const categoryId = e.target.value ? Number(e.target.value) : null;
        onRowChange({ ...row, categoryId }, true);
      }}
    >
      <option value="" disabled>
        Select…
      </option>
      <optgroup label="Expense">
        {expense.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Income">
        {income.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function AmountEditor({ row, onRowChange, onClose }: RenderEditCellProps<SheetRow>) {
  return (
    <input
      autoFocus
      type="number"
      step="0.01"
      className="w-full h-full px-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none text-right"
      defaultValue={row.price || ''}
      onBlur={(e) => {
        onRowChange({ ...row, price: Number(e.target.value) || 0 }, true);
        onClose(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onRowChange({ ...row, price: Number(e.currentTarget.value) || 0 }, true);
          onClose(true);
        }
        if (e.key === 'Escape') onClose(false);
      }}
    />
  );
}

type Props = {
  wallets: IWalletRecordWithCategory[];
  defaultWalletId?: number;
};

// A directly-editable ledger across every wallet, closer to how the user
// actually works in Google Sheets/Excel than the one-record-at-a-time
// modal: pick a month, every row for it is live, edits save on commit
// (Tab/Enter/blur), and there's always a blank row at the bottom ready for
// the next entry - no separate "Add" step.
const RecordsSheetGrid = ({ wallets, defaultWalletId }: Props) => {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const [month, setMonth] = useState(currentMonth);
  // Which "sheet" is showing - 'all' combines every wallet (with its own
  // Wallet column), or a specific wallet id for a single-wallet tab, same
  // idea as Google Sheets' bottom tab strip switching between sheets.
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const fallbackWalletId = defaultWalletId ?? wallets[0]?.id ?? null;

  const [rows, setRows] = useState<SheetRow[]>(() =>
    buildRows(wallets, month, activeTab, fallbackWalletId),
  );

  // Only resync from server data when switching months/tabs - resyncing on
  // every records change would clobber whatever the user is mid-edit on
  // (an invalidated query refetches right after every save below).
  useEffect(() => {
    setRows(buildRows(wallets, month, activeTab, fallbackWalletId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, activeTab]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] });
  };

  const createMutation = useMutation<
    { id: number },
    AxiosError<{ message?: string }>,
    SheetRow
  >({
    mutationFn: (row) => {
      const wallet = wallets.find((w) => w.id === row.walletId)!;
      const category = categories.find((c) => c.id === row.categoryId)!;
      return createRecord({
        id: 0,
        price: row.price,
        remarks: row.remarks,
        date: row.date,
        wallet,
        category,
      } as ICreateRecord);
    },
    onSuccess: (created, row) => {
      invalidate();
      setRows((prev) => {
        const index = prev.findIndex((r) => r === row || (r.id === 0 && r.price === row.price));
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = { ...next[index], id: created.id };
        // Keep exactly one blank row at the bottom.
        if (!next.some((r) => r.id === 0 && r !== next[index])) {
          next.push(makeBlankRow(activeTab === 'all' ? fallbackWalletId : activeTab));
        }
        return next;
      });
    },
    onError: (error) => {
      toast(error.response?.data.message ?? 'Could not save row', { type: 'error' });
    },
  });

  const updateMutation = useMutation<
    unknown,
    AxiosError<{ message?: string }>,
    SheetRow
  >({
    mutationFn: (row) =>
      updateRecord({
        id: row.id,
        price: row.price,
        remarks: row.remarks,
        date: row.date,
        walletId: row.walletId ?? undefined,
        categoryId: row.categoryId ?? undefined,
      }),
    onSuccess: invalidate,
    onError: (error) => {
      toast(error.response?.data.message ?? 'Could not save changes', { type: 'error' });
    },
  });

  const deleteMutation = useMutation<unknown, AxiosError<{ message?: string }>, number>({
    mutationFn: deleteRecord,
    onSuccess: invalidate,
    onError: (error) => {
      toast(error.response?.data.message ?? 'Could not delete row', { type: 'error' });
    },
  });

  const handleRowsChange = (newRows: SheetRow[], { indexes }: RowsChangeData<SheetRow>) => {
    setRows(newRows);

    indexes.forEach((index) => {
      const row = newRows[index];
      if (row.id === 0) {
        // The blank row only becomes a real record once it has enough to
        // create one - a wallet, a category, and a non-zero amount.
        if (row.walletId && row.categoryId && row.price > 0) createMutation.mutate(row);
        return;
      }
      // A row's date can be edited to fall outside the currently-viewed
      // month - it still saves (the server doesn't care), it just won't be
      // in this list anymore once the query refetches and this month is
      // rebuilt from scratch.
      updateMutation.mutate(row);
    });
  };

  // Deleting a row used to fire immediately on icon click with no way to
  // back out of a misclick - every other delete flow in the app (wallet,
  // category, the record modal) confirms first, so this should too.
  const [pendingDelete, setPendingDelete] = useState<SheetRow | null>(null);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setRows((prev) => prev.filter((r) => r.id !== pendingDelete.id));
    deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  };

  // Wallet is only its own column on the "All" tab - on a single-wallet tab
  // it's implied by which tab you're on, same as a Google Sheets tab not
  // needing to repeat which sheet you're looking at on every row.
  const columns: Column<SheetRow>[] = [
    { key: 'date', name: 'Date', editable: true, width: 110 },
    ...(activeTab === 'all'
      ? [
          {
            key: 'walletId',
            name: 'Wallet',
            editable: wallets.length > 1,
            width: 150,
            renderEditCell: (props: RenderEditCellProps<SheetRow>) => (
              <WalletEditor {...props} wallets={wallets} />
            ),
            renderCell: ({ row }: RenderCellProps<SheetRow>) => {
              const wallet = wallets.find((w) => w.id === row.walletId);
              return wallet ? wallet.name : <span className="text-zinc-400 italic">—</span>;
            },
          } satisfies Column<SheetRow>,
        ]
      : []),
    {
      key: 'categoryId',
      name: 'Category',
      editable: true,
      width: 170,
      renderEditCell: (props) => <CategoryEditor {...props} categories={categories} />,
      renderCell: ({ row }: RenderCellProps<SheetRow>) => {
        const category = categories.find((c) => c.id === row.categoryId);
        return (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getCategoryColor(row.categoryId) }}
            />
            <span className={category ? '' : 'text-zinc-400 italic'}>
              {category ? category.name : row.id === 0 ? 'Select…' : '—'}
            </span>
          </span>
        );
      },
    },
    { key: 'remarks', name: 'Description', editable: true },
    {
      key: 'price',
      name: 'Amount',
      editable: true,
      width: 130,
      renderEditCell: (props) => <AmountEditor {...props} />,
      renderCell: ({ row }: RenderCellProps<SheetRow>) => {
        const wallet = wallets.find((w) => w.id === row.walletId);
        return (
          <span
            className={
              categories.find((c) => c.id === row.categoryId)?.type === 'expense'
                ? 'text-danger-600 dark:text-danger-400'
                : 'text-success-600 dark:text-success-400'
            }
          >
            {row.price ? `${row.price.toFixed(2)}${wallet ? ` ${wallet.currency}` : ''}` : ''}
          </span>
        );
      },
    },
    {
      key: 'actions',
      name: '',
      width: 40,
      renderCell: ({ row }: RenderCellProps<SheetRow>) =>
        row.id === 0 ? null : (
          <button
            type="button"
            aria-label="Delete row"
            className="text-zinc-400 hover:text-danger-600"
            onClick={() => setPendingDelete(row)}
          >
            <AiOutlineDelete />
          </button>
        ),
    },
  ];

  const monthTotal = rows.reduce((acc, row) => {
    if (row.id === 0) return acc;
    const category = categories.find((c) => c.id === row.categoryId);
    if (!category) return acc;
    return acc + (category.type === 'expense' ? -row.price : row.price);
  }, 0);

  if (wallets.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Previous month"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <AiOutlineLeft />
          </Button>
          <span className="font-medium text-zinc-800 dark:text-zinc-100 min-w-32 text-center">
            {formatMonthLabel(month)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Next month"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <AiOutlineRight />
          </Button>
          {month !== currentMonth() && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setMonth(currentMonth())}>
              Today
            </Button>
          )}
        </div>
        <span
          className={
            monthTotal >= 0
              ? 'font-medium text-success-600 dark:text-success-400'
              : 'font-medium text-danger-600 dark:text-danger-400'
          }
        >
          Net: {monthTotal.toFixed(2)}
        </span>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Click any cell to edit - changes save as soon as you tab/enter out of it. Fill in the
        blank row at the bottom to add a new transaction. Transfers between wallets aren't shown
        here - edit those from List view.
      </p>

      <DataGrid
        columns={columns}
        rows={rows}
        rowKeyGetter={(row: SheetRow) => row.id}
        onRowsChange={handleRowsChange}
        className="rdg-light dark:rdg-dark rounded-t-xl overflow-hidden"
        style={{ blockSize: Math.min(560, 46 + rows.length * 35) }}
      />

      {/* Bottom sheet tabs, Google Sheets-style - "All" combines every
          wallet into one ledger (with its own Wallet column above); each
          wallet also gets its own tab, just that wallet's rows. */}
      <div className="flex items-center gap-0.5 overflow-x-auto bg-zinc-100 dark:bg-zinc-900 rounded-b-xl px-2 py-1.5 -mt-2 border-t border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={
            'shrink-0 px-3 py-1 text-sm rounded-md transition-colors ' +
            (activeTab === 'all'
              ? 'bg-white dark:bg-zinc-700 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800')
          }
        >
          All wallets
        </button>
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            type="button"
            onClick={() => setActiveTab(wallet.id)}
            className={
              'shrink-0 px-3 py-1 text-sm rounded-md transition-colors ' +
              (activeTab === wallet.id
                ? 'bg-white dark:bg-zinc-700 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800')
            }
          >
            {wallet.name}
          </button>
        ))}
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete this record?"
        message="This can't be undone."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default RecordsSheetGrid;
