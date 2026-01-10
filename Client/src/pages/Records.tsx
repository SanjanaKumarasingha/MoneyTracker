import { useRef, useState } from 'react';
import { useAppDispatch } from '../hooks';
import { IoSettingsOutline } from 'react-icons/io5';
import { ICategory, IRecord } from '../types';
import { AiOutlinePlus } from 'react-icons/ai';
import RecordModal from '../components/record/RecordModal';
import { DateTime } from 'luxon';
import IconSelector from '../components/IconSelector';
import clsx from 'clsx';
import CustomAccordion from '../components/Custom/CustomAccordion';
import CustomModal from '../components/Custom/CustomModal';
import CustomSelector from '../components/Custom/CustomSelector';
import { updateFavWallet } from '../store/walletSlice';
import { useRecord } from '../provider/RecordDataProvider';

type Props = {};

const Records = (props: Props) => {
  const [open, setOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>('');

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

  const { wallets, favWallet, income, expense, total, dateRecords } =
    useRecord();

  const dispatch = useAppDispatch();

  return (
    <div className="relative h-full">
      {favWallet ? (
        <div className="bg-primary-500 p-2 rounded-md text-white relative">
          <div className="relative">
            <div>{favWallet.name}</div>
            <div className="flex items-center justify-between">
              <p>Income:</p> <p>{income.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p>Expense:</p> <p>{expense.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p>Balance:</p> <p>{total.toFixed(2)}</p>
            </div>
            <div className="absolute text-primary-100 text-opacity-25 text-6xl top-0 right-0">
              {favWallet.currency}
            </div>
          </div>
          <div
            className="absolute top-1 right-1 rounded-full p-1 hover:bg-primary-300 active:bg-primary-100 h-fit"
            onClick={() => {
              // Update the fav wallet
              // update the dispatch -> local storage
              setOpenSelectWallet(true);
            }}
          >
            <IoSettingsOutline strokeWidth={1} className="cursor-pointer" />
          </div>
        </div>
      ) : (
        <div>Please create a wallet first to create records.</div>
      )}

      <div
        className="absolute bottom-0 right-0 w-fit p-1 text-2xl text-white rounded-full bg-primary-400 hover:bg-primary-300 active:bg-primary-200 cursor-pointer"
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
      {Object.keys(dateRecords).length > 0 ? (
        <div className="bg-primary-300 dark:bg-primary-600 rounded-md p-2 mt-1">
          {dateRecords.map(({ date, records }, index) => (
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
                    <div>{date}</div>
                    <div>
                      ${' '}
                      {records
                        .reduce((acc, cur) => {
                          const price =
                            cur.category.type === 'expense'
                              ? -Number(cur.price)
                              : Number(cur.price);
                          return acc + price;
                        }, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                }
                customClass="bg-primary-100 dark:bg-primary-400"
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
                        'flex items-center justify-between p-1 bg-white dark:bg-primary-200 rounded-md cursor-pointer hover:bg-primary-50',
                        record.category.type === 'expense'
                          ? 'text-rose-400 '
                          : 'text-info-400 dark:text-info-600',
                      )}
                      onClick={() => {
                        setEditRecord(record);
                        setEditRecordCategory(record.category);
                        setOpen(true);
                      }}
                    >
                      <div className={clsx('flex items-center gap-2')}>
                        <div
                          className={clsx(
                            'p-1 rounded-full text-white bg-amber-400',
                          )}
                        >
                          <IconSelector name={record.category.icon} />
                        </div>
                        <span className="flex items-baseline gap-2">
                          <span>{record.category.name}</span>
                          <span className="text-sm">{record.remarks}</span>
                        </span>
                      </div>

                      <span>
                        {record.category.type === 'expense' && '-'}${' '}
                        {record.price}
                      </span>
                    </div>
                  ))}
                </div>
              </CustomAccordion>
            </div>
          ))}
        </div>
      ) : (
        <div>No records</div>
      )}

      {open && (
        <RecordModal
          wallet={favWallet}
          setOpen={setOpen}
          editRecord={editRecord}
          setEditRecord={setEditRecord}
          recordCategory={editRecordCategory ?? undefined}
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
