import { Axios } from '.';
import { ICreateGoal, IGoal, IGoalWithProgress } from '../types';

export async function fetchGoalsByWallet(
  walletId: number,
): Promise<IGoalWithProgress[]> {
  const response = await Axios.get(`/v1/goals/wallet/${walletId}`);
  return response.data;
}

export async function createGoal(
  newGoal: Partial<ICreateGoal>,
): Promise<IGoal> {
  const response = await Axios.post('/v1/goals', newGoal);
  return response.data;
}

export async function updateGoal(
  goal: Partial<IGoal> & { id: number },
): Promise<IGoal> {
  const response = await Axios.patch(`/v1/goals/${goal.id}`, {
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
  const response = await Axios.delete(`/v1/goals/${id}`);
  return response.data;
}
