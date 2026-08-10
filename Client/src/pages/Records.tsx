import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { IoSearchOutline, IoSettingsOutline } from 'react-icons/io5';
import { ICategory, IRecord, IRecordWithCategory } from '../types';
import { AiOutlinePlus } from 'react-icons/ai';
import { BsArrowLeftRight } from 'react-icons/bs';
import RecordModal from '../components/record/RecordModal';
import RecordsSheetGrid from '../components/record/RecordsSheetGrid';
import TransferModal from '../components/wallet/TransferModal';
import { DateTime } from 'luxon';
import IconSelector from '../components/IconSelector';
import clsx from 'clsx';
import * as _ from 'lodash';
import DatePicker from 'react-datepicker';
import CustomAccordion from '../components/Custom/CustomAccordion';
import CustomModal from '../components/Custom/CustomModal';
import CustomSelector from '../components/Custom/CustomSelector';
import { updateFavWallet } from '../store/walletSlice';
import { useRecord } from '../provider/RecordDataProvider';
import { Button, Card, EmptyState, Input, Select, Skeleton } from '../components/ui';

type Props = {};

const Records = (props: Props) => {
  const [open, setOpen] = useState(false);

  const [openTransfer, setOpenTransfer] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>('');

  // "List" is the grouped/filterable accordion view below; "Sheet" is a
  // directly-editable Google-Sheets-style grid (RecordsSheetGrid) for
  // people who'd rather just type straight into a ledger.
  const [viewMode, setViewMode] = useState<'list' | 'sheet'>('list');

  const headerRef = useRef<HTMLDivElement>(null);

  const [openSelectWallet, setOpenSelectWallet] = useState(false);

  const [editRecord, setEditRecord] = useState<IRecord>({
    id: 0,
    price: 0,
    remarks: '',
    date: DateTime.now().toISO() ?? DateTime.now().toFormat('yyyy-LL-dd'),
  });

  const [editRecordCategory, setEditRecordCategory] =
    useState<ICategory | null>(null);

  const { wallets, favWallet, income, expense, total } = useRecord();

  const dispatch = useAppDispatch();
  const location = useLocation();

  const isLoading = !wallets;

  const ALL_CATEGORIES = 'All categories';

  const [searchTerm, setSearchTerm] = useState<string>('');
  // Arriving from a category drill-down (PieChart's PercentRow rows on
  // /charts) pre-applies that category as the active filter here.
  const [categoryFilter, setCategoryFilter] = useState<string>(
    (location.state as { categoryFilter?: string } | null)?.categoryFilter ??
      ALL_CATEGORIES,
  );
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  // Date-range filters start collapsed - most visits don't need them, and
  // always rendering a third filter row pushed the actual record list
  // further down the screen on every visit regardless of whether it was
  // ever used that session.
  const [showDateFilters, setShowDateFilters] = useState(false);

  const categoryOptions = useMemo(() => {
    const names = _.uniq(
      (favWallet?.records ?? [])
        .map((record) => record.category?.name)
        .filter((name): name is string => Boolean(name)),
    ).sort();

    return [ALL_CATEGORIES, ...names];
  }, [favWallet]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    categoryFilter !== ALL_CATEGORIES ||
    dateFrom !== null ||
    dateTo !== null;

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter(ALL_CATEGORIES);
    setDateFrom(null);
    setDateTo(null);
  };

  // Apply all active filters (AND) client-side over the records already
  // available in memory for the selected wallet.
  const filteredRecords: IRecordWithCategory[] = useMemo(() => {
    const records = favWallet?.records ?? [];

    return records.filter((record) => {
      if (
        searchTerm.trim() &&
        !record.remarks?.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ) {
        return false;
      }

      if (
        categoryFilter !== ALL_CATEGORIES &&
        record.category?.name !== categoryFilter
      ) {
        return false;
      }

      if (dateFrom) {
        const recordDate = DateTime.fromSQL(record.date).startOf('day');
        const from = DateTime.fromJSDate(dateFrom).startOf('day');
        if (recordDate < from) return false;
      }

      if (dateTo) {
        const recordDate = DateTime.fromSQL(record.date).startOf('day');
        const to = DateTime.fromJSDate(dateTo).startOf('day');
        if (recordDate > to) return false;
      }

      return true;
    });
  }, [favWallet, searchTerm, categoryFilter, dateFrom, dateTo]);

  // Reproduce the provider's date-grouping locally over the filtered
  // records, since RecordDataProvider's grouping is tied to the full,
  // unfiltered favWallet.records and isn't decomposed for reuse here.
  const filteredDateRecords = useMemo(() => {
    const groupedDates = _.groupBy(filteredRecords, 'date');

    return _.sortBy(Object.keys(groupedDates)).map((date) => ({
      date,
      records: groupedDates[date],
    }));
  }, [filteredRecords]);

  return (
    <div className="relative h-full">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-16 w-full mt-2" />
          <div className="space-y-2 mt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : favWallet ? (
        <Card className="relative">
          <div className="relative">
            <div className="font-medium text-zinc-800 dark:text-zinc-100">
              {favWallet.name}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 dark:text-zinc-400">Income:</p>{' '}
              <p className="font-medium text-success-600 dark:text-success-400">
                {income.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 dark:text-zinc-400">Expense:</p>{' '}
              <p className="font-medium text-danger-600 dark:text-danger-400">
                {expense.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">
                Balance:
              </p>{' '}
              <p
                className={clsx(
                  'text-lg font-bold',
                  total >= 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400',
                )}
              >
                {total.toFixed(2)}
              </p>
            </div>
            <div className="absolute text-zinc-100 dark:text-zinc-700 text-6xl top-0 right-0 pointer-events-none select-none">
              {favWallet.currency}
            </div>
          </div>
          <div
            className="absolute top-1 right-1 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700 h-fit"
            onClick={() => {
              // Update the fav wallet
              // update the dispatch -> local storage
              setOpenSelectWallet(true);
            }}
          >
            <IoSettingsOutline strokeWidth={1} className="cursor-pointer" />
          </div>
        </Card>
      ) : (
        <div>Please create a wallet first to create records.</div>
      )}

      {!isLoading && favWallet && (
        <div className="flex gap-1 mt-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List view
          </Button>
          <Button
            variant={viewMode === 'sheet' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('sheet')}
          >
            Sheet view
          </Button>
        </div>
      )}

      {/* fixed (viewport-relative), not absolute (content-relative) - the
          content column's height grows with the record list, so an
          absolute-positioned FAB anchored to its bottom drifted far below
          the visible screen on long lists instead of staying reachable.
          bottom-20 on mobile clears the fixed BottomNavbar (~64px); sm:
          screens have no bottom nav, so bottom-6 is enough there. */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-30 flex flex-col gap-2 items-end">
        <div
          className="w-fit p-1.5 text-lg text-white rounded-full bg-zinc-600 hover:bg-zinc-500 active:bg-zinc-700 cursor-pointer transition-colors"
          onClick={() => setOpenTransfer(true)}
          aria-label="Transfer between wallets"
          title="Transfer between wallets"
        >
          <BsArrowLeftRight />
        </div>
        <div
          className="w-fit p-1 text-2xl text-white rounded-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 cursor-pointer transition-colors"
          onClick={() => {
            setEditRecord((prev) => ({
              ...prev,
              id: 0,
              price: 0,
              remarks: '',
            }));
            setOpen(true);
          }}
        >
          <AiOutlinePlus />
        </div>
      </div>

      {viewMode === 'list' && !isLoading && favWallet && favWallet.records.length > 0 && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
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
            <Button
              variant={dateFrom || dateTo ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowDateFilters((prev) => !prev)}
            >
              {dateFrom || dateTo ? 'Date filter active' : 'Filters'}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {showDateFilters && (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  From
                </label>
                <DatePicker
                  selected={dateFrom}
                  onChange={(date) => setDateFrom(date)}
                  selectsStart
                  startDate={dateFrom}
                  endDate={dateTo}
                  maxDate={dateTo ?? undefined}
                  isClearable
                  placeholderText="From date"
                  className="outline-none border border-zinc-300 dark:border-zinc-600 rounded-lg p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  To
                </label>
                <DatePicker
                  selected={dateTo}
                  onChange={(date) => setDateTo(date)}
                  selectsEnd
                  startDate={dateFrom}
                  endDate={dateTo}
                  minDate={dateFrom ?? undefined}
                  isClearable
                  placeholderText="To date"
                  className="outline-none border border-zinc-300 dark:border-zinc-600 rounded-lg p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'sheet' && !isLoading && favWallet && (
        <div className="mt-2">
          <RecordsSheetGrid wallets={wallets} defaultWalletId={favWallet?.id} />
        </div>
      )}

      {viewMode === 'list' && (isLoading ? null : !favWallet || favWallet.records.length === 0 ? (
        <div>No records</div>
      ) : filteredDateRecords.length === 0 ? (
        <EmptyState
          title="No records match your filters"
          description="Try adjusting or clearing your search, category, or date filters."
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <Card padding="sm" className="mt-1">
          {filteredDateRecords.map(({ date, records }, index) => {
            const dailyTotal = records.reduce((acc, cur) => {
              // cur.category can be null for records whose category was
              // later deleted (server soft-deletes categories, so the join
              // comes back null) — skip them rather than throwing here.
              if (!cur.category) return acc;
              const price =
                cur.category.type === 'expense'
                  ? -Number(cur.price)
                  : Number(cur.price);
              return acc + price;
            }, 0);

            return (
              <div key={index} className="py-1">
                <CustomAccordion
                  header={
                    <div
                      ref={headerRef}
                      className="accordion-header flex justify-between items-center"
                      onClick={() => {
                        setEditRecord((prev) => ({ ...prev, date: date }));
                      }}
                    >
                      <div className="text-zinc-700 dark:text-zinc-200">
                        {date}
                      </div>
                      <div
                        className={clsx(
                          'font-medium',
                          dailyTotal >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400',
                        )}
                      >
                        $ {dailyTotal.toFixed(2)}
                      </div>
                    </div>
                  }
                  customClass="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-700"
                  triggerUpdate={favWallet}
                  hideArrow
                  controlled={{
                    expanded: selectedDate === date,
                    handleChange: (
                      open: boolean,
                      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
                    ) => {
                      if (open) {
                        setSelectedDate('');
                      } else {
                        setSelectedDate(date);
                      }
                    },
                  }}
                >
                  <div className="space-y-1">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className={clsx(
                          'flex items-center justify-between p-1 bg-white dark:bg-zinc-800 rounded-md',
                          record.isTransfer
                            ? 'cursor-default'
                            : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700',
                        )}
                        onClick={() => {
                          // Transfers are a matched pair of records with no
                          // real category to edit (see apis/transfer.ts) —
                          // editing one side here would desync it from its
                          // other half, so the normal edit modal is skipped.
                          if (record.isTransfer) return;
                          setEditRecord(record);
                          setEditRecordCategory(record.category);
                          setOpen(true);
                        }}
                      >
                        {record.category ? (
                          <>
                            <div className={clsx('flex items-center gap-2')}>
                              <div
                                className={clsx(
                                  'p-1 rounded-full text-white',
                                  record.category.type === 'expense'
                                    ? 'bg-danger-500'
                                    : 'bg-success-500',
                                )}
                              >
                                <IconSelector name={record.category.icon} />
                              </div>
                              <span className="flex items-baseline gap-2">
                                <span className="text-zinc-800 dark:text-zinc-100">
                                  {record.category.name}
                                </span>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {record.remarks}
                                </span>
                              </span>
                            </div>

                            <span
                              className={clsx(
                                'font-medium',
                                record.category.type === 'expense'
                                  ? 'text-danger-600 dark:text-danger-400'
                                  : 'text-success-600 dark:text-success-400',
                              )}
                            >
                              {record.category.type === 'expense' && '-'}${' '}
                              {record.price}
                            </span>
                          </>
                        ) : (
                          // Category was deleted after this record was created —
                          // there's no category data left to render (server
                          // soft-deletes categories, so the join comes back null
                          // rather than throwing). Show a plain fallback instead
                          // of crashing the whole accordion for this wallet.
                          <>
                            <span className="flex items-baseline gap-2 text-zinc-400 dark:text-zinc-500 italic">
                              <span>Deleted category</span>
                              <span className="text-sm">{record.remarks}</span>
                            </span>
                            <span className="font-medium text-zinc-400 dark:text-zinc-500">
                              $ {record.price}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CustomAccordion>
              </div>
            );
          })}
        </Card>
      ))}

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

      {openSelectWallet && (
        <CustomModal setOpen={setOpenSelectWallet}>
          <div>
            <p className="text-2xl">Select your wallet</p>

            <div className="py-2">
              <p className="font-semibold">Current wallet:</p>

              <div>Name: {favWallet?.name}</div>
              <div>Currency: {favWallet?.currency}</div>
            </div>
            <div>
              <CustomSelector
                title={'Wallet List'}
                options={wallets?.map((w) => w.name) ?? []}
                value={favWallet?.name}
                callbackAction={(value) => {
                  const newFavWallet = wallets?.find((w) => w.name === value);
                  if (newFavWallet) {
                    dispatch(updateFavWallet(newFavWallet.id));
                  }
                }}
              />
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default Records;
