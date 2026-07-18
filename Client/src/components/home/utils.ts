export const formatMoney = (amount: number, currency?: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `${currency ? currency + ' ' : ''}${amount.toFixed(2)}`;
  }
};
