import { colors } from '@/theme/colors';

export type RatioBand = {
  light: string;
  mid: string;
  deep: string;
  label: string;
};

// Shared by the Home wallet list and the wallet-detail gauge: how much of a
// wallet's income is still unspent this month, banded into a color a user
// can read at a glance without doing the arithmetic themselves.
export function getIncomeRatio(income: number, expense: number): number {
  if (income <= 0) return expense > 0 ? 0 : 100;
  return Math.max(0, Math.round(((income - expense) / income) * 100));
}

export function getRatioBand(ratio: number): RatioBand {
  if (ratio >= 60) {
    return {
      light: colors.waterHealthyLight,
      mid: colors.waterHealthyMid,
      deep: colors.waterHealthyDeep,
      label: 'Healthy',
    };
  }
  if (ratio >= 30) {
    return {
      light: colors.waterCautionLight,
      mid: colors.waterCautionMid,
      deep: colors.waterCautionDeep,
      label: 'Caution',
    };
  }
  return {
    light: colors.waterDangerLight,
    mid: colors.waterDangerMid,
    deep: colors.waterDangerDeep,
    label: 'Low',
  };
}
