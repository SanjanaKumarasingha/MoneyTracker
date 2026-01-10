import { useRef, useState } from 'react';

import { AiOutlinePlus } from 'react-icons/ai';
import { HiOutlineTrash } from 'react-icons/hi';

import { IWallet } from '../types';
import WalletModal from '../components/wallet/WalletModal';
import { useRecord } from '../provider/RecordDataProvider';

type WalletPageProps = {};

const WalletPage = (prop: WalletPageProps) => {
  const [open, setOpen] = useState(false);

  const [editWallet, setEditWallet] = useState<IWallet>({
    id: 0,
    name: '',
    currency: '',
  });

  const [type, setType] = useState<'Create' | 'Edit' | 'Delete'>('Create');

  const trashRef = useRef<HTMLDivElement>(null);

  const { wallets } = useRecord();

  return (
    <div className="">
      <div className="bg-amber-200 rounded-md p-2 dark:text-primary-900">
        <div className="flex justify-between items-center pb-2">
          <span>List of Wallets</span>
          <div className="hover:bg-amber-50 hover:bg-opacity-50 rounded-full p-1">
            <AiOutlinePlus
              className="cursor-pointer "
              onClick={() => {
                setOpen(true);
                setType('Create');
                setEditWallet({ id: 0, name: '', currency: '' });
              }}
            />
          </div>
        </div>
        {wallets && (
          <div className="grid grid-flow-col overflow-x-auto grid-rows-2 py-2 gap-2 w-fit p-2 transition-all duration-300">
            {wallets.map(({ id, name, currency, records }) => (
              <div
                key={id}
                className="rounded-md bg-amber-100 p-3 relative flex flex-col gap-3 w-[200px] hover:scale-105 cursor-pointer transition-all duration-300"
                onClick={(event) => {
                  if (
                    trashRef.current &&
                    !trashRef.current.contains(event.target as Node)
                  ) {
                    setOpen(true);
                    setType('Edit');
                    setEditWallet((prev) => {
                      return { ...prev, id, name, currency };
                    });
                  }
                }}
              >
                <span className="absolute font-semibold text-amber-500 text-opacity-10 text-5xl sm:text-7xl  right-1 bottom-1">
                  {currency}
                </span>
                <div
                  className="absolute text-zinc-400 right-1 cursor-pointer hover:bg-zinc-200 hover:bg-opacity-50 rounded-full p-1 active:bg-zinc-300 active:bg-opacity-50"
                  ref={trashRef}
                  onClick={() => {
                    setOpen(true);
                    setType('Delete');
                    setEditWallet((prev) => {
                      return { ...prev, id };
                    });
                  }}
                >
                  <HiOutlineTrash strokeWidth={1} />
                </div>

                <div>{name}</div>
                <div>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(
                    records?.reduce((acc, cur) => {
                      if (cur.category.type === 'expense') {
                        acc -= Number(cur.price);
                      } else {
                        acc += Number(cur.price);
                      }
                      return acc;
                    }, 0) ?? 0,
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <WalletModal
          type={type}
          editWallet={editWallet}
          setOpen={setOpen}
          setEditWallet={setEditWallet}
        />
      )}
    </div>
  );
};
export default WalletPage;
