import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { IoSearchOutline } from 'react-icons/io5';
import { ICategory, IRecord, IRecordWithCategory } from '../types';
import { AiOutlinePlus } from 'react-icons/ai';
import { BsArrowLeftRight } from 'react-icons/bs';
import RecordModal from '../components/record/RecordModal';
import RecordsSheetGrid from '../components/record/RecordsSheetGrid';
import PeriodBar from '../components/record/PeriodBar';
import TransferModal from '../components/wallet/TransferModal';
import { DateTime } from 'luxon';
import IconSelector from '../components/IconSelector';
import clsx from 'clsx';
import * as _ from 'lodash';
import { updateFavWallet } from '../store/walletSlice';
import { useRecord } from '../provider/RecordDataProvider';
import {
  Button,
  Card,
  EmptyState,
  GlassFab,
  Input,
  Money,
  Select,
  SegmentedControl,
  Skeleton,
} from '../components/ui';
import { formatMoney } from '../utils';
import { getCategoryColor } from '../utils/categoryColor';
import { signedAmount } from '../utils/portfolio';
import {
  CustomRange,
  PeriodScale,
  getPeriodRange,
  isDateInRange,
  relativeDayLabel,
} from '../utils/period';

type Props = {};

const ALL_CATEGORIES = 'All categories';
// Days of records rendered before "Show more" - an All-time view can be
// thousands of rows, and none of them are useful to mount up front.
const DAYS_PER_PAGE = 14;

const Records = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);

  // "List" is the day-grouped feed; "Sheet" is a directly-editable
  // Google-Sheets-style grid (RecordsSheetGrid). Both read the same period
  // and (for List) the same filters.
  const [viewMode, setViewMode] = useState<'list' | 'sheet'>('list');

  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });
  const [editRecordCategory, setEditRecordCategory] =
    useState<ICategory | null>(null);

  const { wallets, favWallet } = useRecord();

  const dispatch = useAppDispatch();
  const location = useLocation();

  const isLoading = !wallets;

  // ---- Period (Week / Month / Year / Custom / All) --------------------
  const [scale, setScale] = useState<PeriodScale>('month');
  const [offset, setOffset] = useState(0);
  const [custom, setCustom] = useState<CustomRange>({ from: '', to: '' });
  const range = useMemo(() => getPeriodRange(scale, offset, custom), [scale, offset, custom]);

  // ---- Filters (List view) -------------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Arriving from a category drill-down (Charts' category rows) pre-applies
  // that category as the active filter here.
  const [categoryFilter, setCategoryFilter] = useState<string>(
    (location.state as { categoryFilter?: string } | null)?.categoryFilter ??
      ALL_CATEGORIES,
  );
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);

  const categoryOptions = useMemo(() => {
    const names = _.uniq(
      (favWallet?.records ?? [])
        .map((record) => record.category?.name)
        .filter((name): name is string => Boolean(name)),
    ).sort();

    return [ALL_CATEGORIES, ...names];
  }, [favWallet]);

  const hasActiveFilters =
    searchTerm.trim() !== '' || categoryFilter !== ALL_CATEGORIES;

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter(ALL_CATEGORIES);
  };

  // Records in the selected period (before search/category) - drives the
  // summary tiles, so those describe the period, not the filtered list.
  const periodRecords: IRecordWithCategory[] = useMemo(
    () => (favWallet?.records ?? []).filter((record) => isDateInRange(record.date, range)),
    [favWallet, range],
  );

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    periodRecords.forEach((record) => {
      // Transfers move money between your own wallets - not earning/spending.
      if (!record.category || record.isTransfer) return;
      if (record.category.type === 'expense') expense += Number(record.price);
      else income += Number(record.price);
    });
    return { income, expense, net: income - expense };
  }, [periodRecords]);

  const walletBalance = useMemo(
    () => (favWallet?.records ?? []).reduce((acc, record) => acc + signedAmount(record), 0),
    [favWallet],
  );

  const filteredRecords: IRecordWithCategory[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return periodRecords.filter((record) => {
      if (term && !record.remarks?.toLowerCase().includes(term)) return false;
      if (categoryFilter !== ALL_CATEGORIES && record.category?.name !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [periodRecords, searchTerm, categoryFilter]);

  // Newest day first (the feed answers "what happened lately"), and within a
  // day the most recently added record first.
  const dayGroups = useMemo(() => {
    const grouped = _.groupBy(filteredRecords, (record) => record.date.slice(0, 10));
    return Object.keys(grouped)
      .sort()
      .reverse()
      .map((date) => ({
        date,
        records: [...grouped[date]].sort((a, b) => b.id - a.id),
      }));
  }, [filteredRecords]);

  const openNewRecord = () => {
    setEditRecord((prev) => ({
      ...prev,
      id: 0,
      price: 0,
      remarks: '',
      // A previously-edited record's date would otherwise leak into "new".
      date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
    }));
    setEditRecordCategory(null);
    setOpen(true);
  };

  const hasAnyRecords = (favWallet?.records.length ?? 0) > 0;
  const netPositive = summary.net >= 0;

  return (
    <div className="relative flex flex-col gap-5">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !favWallet ? (
        <EmptyState
          title="No wallet yet"
          description="Create a wallet first, then come back here to log records against it."
        />
      ) : (
        <>
          {/* Wallet switcher - always visible pills instead of the old
              buried gear icon + modal; switching also updates the app-wide
              "favorite" wallet, same as it always did. */}
          {wallets.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Wallet">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  role="tab"
                  aria-selected={wallet.id === favWallet.id}
                  onClick={() => dispatch(updateFavWallet(wallet.id))}
                  className={clsx(
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium cursor-pointer transition-colors',
                    wallet.id === favWallet.id
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
                  )}
                >
                  {wallet.name}
                </button>
              ))}
            </div>
          )}

          {/* Summary: plain high-contrast text on the card surface. The old
              header had a giant currency-code watermark behind the numbers
              (text-zinc-100 on white, zinc-700 on dark) that fought the
              figures for legibility - gone. */}
          <Card padding="lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {favWallet.name} · balance
                </p>
                <p>
                  <Money
                    amount={walletBalance}
                    currency={favWallet.currency}
                    prefix={walletBalance < 0 ? '−' : undefined}
                    tone={walletBalance >= 0 ? 'default' : 'negative'}
                    className="text-3xl"
                  />
                </p>
              </div>
              <p className="rounded-full bg-zinc-100 dark:bg-white/5 dark:border dark:border-white/10 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-slate-300">
                {range ? range.label : 'All time'} · {periodRecords.length} record
                {periodRecords.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-success-500/10 border border-success-500/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-success-700 dark:text-success-300">
                  Income
                </p>
                <p className="mt-0.5 text-xl font-bold text-success-600 dark:text-success-400">
                  +{formatMoney(summary.income, favWallet.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-danger-500/10 border border-danger-500/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-danger-700 dark:text-danger-300">
                  Expense
                </p>
                <p className="mt-0.5 text-xl font-bold text-danger-600 dark:text-danger-400">
                  −{formatMoney(summary.expense, favWallet.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  Net
                </p>
                <p
                  className={clsx(
                    'mt-0.5 text-xl font-bold',
                    netPositive
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-danger-600 dark:text-danger-400',
                  )}
                >
                  {netPositive ? '+' : '−'}
                  {formatMoney(Math.abs(summary.net), favWallet.currency)}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <PeriodBar
                scale={scale}
                onScaleChange={setScale}
                offset={offset}
                onOffsetChange={setOffset}
                custom={custom}
                onCustomChange={setCustom}
                range={range}
              />
              <SegmentedControl
                aria-label="View"
                options={[
                  { value: 'list', label: 'List' },
                  { value: 'sheet', label: 'Sheet' },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
            </div>

            {viewMode === 'list' && hasAnyRecords && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Search remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<IoSearchOutline />}
                  containerClassName="flex-1"
                />
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder={ALL_CATEGORIES}
                  filter
                  className="sm:w-56"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {viewMode === 'sheet' && (
            <RecordsSheetGrid wallets={wallets} defaultWalletId={favWallet.id} range={range} />
          )}

          {viewMode === 'list' &&
            (!hasAnyRecords ? (
              <EmptyState
                title="No records yet"
                description="Add your first income or expense record for this wallet using the + button below."
                actionLabel="Add a record"
                onAction={openNewRecord}
              />
            ) : dayGroups.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'No records match your filters' : 'Nothing in this period'}
                description={
                  hasActiveFilters
                    ? 'Try adjusting or clearing your search or category filter.'
                    : 'No records fall in the selected dates. Try another period, or All time.'
                }
                actionLabel={hasActiveFilters ? 'Clear filters' : scale !== 'all' ? 'Show all time' : undefined}
                onAction={
                  hasActiveFilters ? clearFilters : scale !== 'all' ? () => setScale('all') : undefined
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                {dayGroups.slice(0, visibleDays).map(({ date, records }) => {
                  const dailyTotal = records.reduce((acc, record) => acc + signedAmount(record), 0);

                  return (
                    <section key={date} aria-label={relativeDayLabel(date)}>
                      <div className="mb-2 flex items-center justify-between px-1">
                        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                          {relativeDayLabel(date)}
                          <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
                            {DateTime.fromFormat(date, 'yyyy-LL-dd').toFormat('LLL d, yyyy')}
                          </span>
                        </h3>
                        <span
                          className={clsx(
                            'text-sm font-semibold',
                            dailyTotal >= 0
                              ? 'text-success-600 dark:text-success-400'
                              : 'text-danger-600 dark:text-danger-400',
                          )}
                        >
                          {dailyTotal >= 0 ? '+' : '−'}
                          {formatMoney(Math.abs(dailyTotal), favWallet.currency)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {records.map((record) => {
                          const category = record.category;
                          const isExpense = category?.type === 'expense';
                          const editable = !record.isTransfer && !!category;

                          return (
                            <Card
                              key={record.id}
                              padding="sm"
                              role={editable ? 'button' : undefined}
                              tabIndex={editable ? 0 : undefined}
                              onClick={() => {
                                // Transfers are a matched pair of records with
                                // no real category to edit (see
                                // apis/transfer.ts) - editing one side here
                                // would desync it from its other half, so the
                                // normal edit modal is skipped.
                                if (!editable) return;
                                setEditRecord(record);
                                setEditRecordCategory(category);
                                setOpen(true);
                              }}
                              onKeyDown={(event) => {
                                if (editable && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault();
                                  setEditRecord(record);
                                  setEditRecordCategory(category);
                                  setOpen(true);
                                }
                              }}
                              className={clsx(
                                'flex items-center gap-3 !px-3 !py-2.5',
                                editable &&
                                  'cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                              )}
                            >
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                                style={{
                                  backgroundColor: record.isTransfer
                                    ? '#64748b'
                                    : getCategoryColor(category?.id),
                                }}
                              >
                                {category && <IconSelector name={category.icon} />}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  {category ? (
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      {category.name}
                                    </span>
                                  ) : (
                                    // Category was deleted after this record was
                                    // created - the server soft-deletes
                                    // categories, so the join comes back null.
                                    <span className="italic text-zinc-400 dark:text-zinc-500">
                                      Deleted category
                                    </span>
                                  )}
                                  <span className="rounded-md bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                                    {favWallet.name}
                                  </span>
                                </div>
                                {record.remarks && (
                                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                    {record.remarks}
                                  </p>
                                )}
                              </div>

                              <span
                                className={clsx(
                                  'shrink-0 text-base font-bold tabular-nums',
                                  !category
                                    ? 'text-zinc-400 dark:text-zinc-500'
                                    : isExpense
                                    ? 'text-danger-600 dark:text-danger-400'
                                    : 'text-success-600 dark:text-success-400',
                                )}
                              >
                                {category && (isExpense ? '−' : '+')}
                                {formatMoney(Number(record.price), favWallet.currency)}
                              </span>
                            </Card>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {dayGroups.length > visibleDays && (
                  <Button
                    variant="outline"
                    className="self-center"
                    onClick={() => setVisibleDays((count) => count + DAYS_PER_PAGE)}
                  >
                    Show more days ({dayGroups.length - visibleDays} left)
                  </Button>
                )}
              </div>
            ))}
        </>
      )}

      {/* fixed (viewport-relative), not absolute (content-relative) - the
          content column's height grows with the record list, so an
          absolute-positioned FAB anchored to its bottom drifted far below
          the visible screen on long lists. bottom-20 on mobile clears the
          fixed BottomNavbar (~64px); sm: screens have no bottom nav.
          Transfer keeps a neutral tint since Add is the one primary action
          on this screen (see GlassFab's own comment). */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-30 flex flex-col gap-2 items-end">
        <GlassFab
          variant="neutral"
          size={40}
          icon={<BsArrowLeftRight />}
          onClick={() => setOpenTransfer(true)}
          aria-label="Transfer between wallets"
          title="Transfer between wallets"
        />
        <GlassFab
          variant="primary"
          size={56}
          icon={<AiOutlinePlus />}
          aria-label="Add record"
          title="Add record"
          onClick={openNewRecord}
        />
      </div>

      {open && (
        <RecordModal
          wallet={favWallet}
          setOpen={setOpen}
          editRecord={editRecord}
          setEditRecord={setEditRecord}
          recordCategory={editRecordCategory ?? undefined}
        />
      )}

      {openTransfer && (
        <TransferModal
          setOpen={setOpenTransfer}
          defaultFromWalletId={favWallet?.id}
        />
      )}
    </div>
  );
};

export default Records;
