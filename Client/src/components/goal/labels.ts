import { EGoalPeriodType } from '../../common/goal-period-type.enum';

export const PERIOD_LABELS: Record<EGoalPeriodType, string> = {
  [EGoalPeriodType.WEEKLY]: 'Weekly',
  [EGoalPeriodType.MONTHLY]: 'Monthly',
  [EGoalPeriodType.YEARLY]: 'Yearly',
  [EGoalPeriodType.CUSTOM]: 'Custom range',
};
