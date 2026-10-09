import { getBudgetStatusColor, getScheduleStatusColor } from '../goalStatus';
import { colors } from '@/theme/colors';

describe('getBudgetStatusColor', () => {
  it.each([
    [0, colors.success],
    [69.9, colors.success],
    [70, colors.amber],
    [89.9, colors.amber],
    [90, colors.danger],
    [150, colors.danger],
  ])('%p%% of budget used -> %s', (percent, expected) => {
    expect(getBudgetStatusColor(percent)).toBe(expected);
  });
});

describe('getScheduleStatusColor', () => {
  it('treats a goal with no pace data yet as on track', () => {
    expect(getScheduleStatusColor(null)).toBe(colors.success);
  });

  it.each([
    [120, colors.success],
    [90, colors.success],
    [89.9, colors.amber],
    [70, colors.amber],
    [69.9, colors.danger],
    [0, colors.danger],
  ])('%p%% of expected pace -> %s', (ratio, expected) => {
    expect(getScheduleStatusColor(ratio)).toBe(expected);
  });
});
