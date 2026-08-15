import { Axios } from './index';
import { IGoal, IGoalWithProgress, ICreateGoal } from '../types';

export async function fetchGoalsByWallet(
  walletId: number,
): Promise<IGoalWithProgress[]> {
  const response = await Axios.get(`/goals/wallet/${walletId}`);
  return response.data;
}

export async function createGoal(
  newGoal: Partial<ICreateGoal>,
): Promise<IGoal> {
  const response = await Axios.post('/goals', newGoal);
  return response.data;
}

export async function updateGoal(
  goal: Partial<IGoal> & { id: number },
): Promise<IGoal> {
  const response = await Axios.patch(`/goals/${goal.id}`, {
    name: goal.name,
    type: goal.type,
    periodType: goal.periodType,
    targetAmount: goal.targetAmount,
    startDate: goal.startDate,
    endDate: goal.endDate,
  });
  return response.data;
}

export async function deleteGoal(id: number) {
  const url = `/goals/${id}`;

  const response = await Axios.delete(url);

  return response.data;
}
