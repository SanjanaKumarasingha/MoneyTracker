// Shared border-radius scale, formalizing the rough 8/10/12/14/16/999
// convention already dominant across the app — snap any one-off value
// (7/9/11/15/17/18/22/28 etc.) to the nearest token instead of inventing more.
export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 999,
};
