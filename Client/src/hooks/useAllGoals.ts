import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGoalsByWallet } from '../apis/goal';
import { useRecord } from '../provider/RecordDataProvider';
import { IGoalWithProgress } from '../types';

export const ALL_GOALS_KEY = 'allGoals';

/**
 * Every goal across every wallet the user has. The API is per-wallet only
 * (GET /goals/wallet/:id), so this fans out one request per wallet - same
 * approach Mobile's Plan tab takes. Shared by Goals, Home (wallet budget
 * tracks + spending pacing), Charts (per-category limits) and Wallets.
 * Invalidate with `queryClient.invalidateQueries({ queryKey: [ALL_GOALS_KEY] })`.
 */
export function useAllGoals() {
  const { wallets } = useRecord();
  const walletIds = useMemo(() => (wallets ?? []).map((wallet) => wallet.id), [wallets]);

  const query = useQuery<IGoalWithProgress[]>({
    queryKey: [ALL_GOALS_KEY, walletIds],
    queryFn: async () => (await Promise.all(walletIds.map(fetchGoalsByWallet))).flat(),
    enabled: walletIds.length > 0,
  });

  return { ...query, goals: query.data ?? [] };
}
