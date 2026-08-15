import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { fetchWallets } from '@/apis/wallet';
import { useAuth } from '@/provider/AuthProvider';
import { useAppSelector } from '@/hooks';
import { IWalletRecordWithCategory } from '@/types';
import RecordFormModal from '@/components/record/RecordFormModal';

// The central "+" tab has no content of its own — tapping it immediately
// presents RecordFormModal (a full-screen slide-up) for the user's current
// favourite wallet, then returns to Home. Mirrors the default-to-first-
// wallet fallback already used on the Records tab.
export default function AddRecordScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const favWalletId = useAppSelector((state) => state.wallet.id);

  // RecordFormModal only resets its internal form state when its `visible`
  // prop flips from false to true, but this screen keeps `visible` fixed at
  // `true` the whole time it's mounted — remounting it via a changing `key`
  // on every focus is what actually gives a clean form each time "+" is
  // tapped, rather than reusing whatever was left over from the last visit.
  const [instanceKey, setInstanceKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setInstanceKey((key) => key + 1);
    }, []),
  );

  const { data: wallets } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const favWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return undefined;
    if (favWalletId === 0) return wallets[0];
    return wallets.find((w) => w.id === favWalletId) ?? wallets[0];
  }, [wallets, favWalletId]);

  return (
    <RecordFormModal
      key={instanceKey}
      visible
      wallet={favWallet}
      record={null}
      category={null}
      onClose={() => router.replace('/')}
    />
  );
}
