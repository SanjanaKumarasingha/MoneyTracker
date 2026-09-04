// ISO currency codes offered when creating/editing a wallet — mirrors
// Client/src/utils/index.ts's `currencyList` so wallet currency options match
// the web app.
export const currencyList = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV',
  'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF',
  'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUC', 'CUP', 'CVE',
  'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD',
  'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD',
  'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK',
  'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD',
  'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL',
  'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN',
  'MXV', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR',
  'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
  'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE',
  'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT',
  'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'USN',
  'UYI', 'UYU', 'UZS', 'VED', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XCD',
  'XDR', 'XOF', 'XPF', 'XSU', 'XUA', 'YER', 'ZAR', 'ZMW', 'ZWL',
];

// currencyDisplay: 'code' (not the default 'symbol') so every value reads
// as e.g. "LKR 43,050.00" — a currency symbol alone is ambiguous or absent
// for many of the ISO codes above, but the code always is.
function currencyFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' });
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return currencyFormatter(currency).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// Splits a formatted currency string into a "main" part (currency code +
// grouped integer digits) and a "decimal" part (the trailing ".00"), so
// callers can render the fractional digits smaller/muted and cut down on
// how much a long figure competes for attention — see CurrencyText.
export function formatCurrencyParts(amount: number, currency = 'USD'): { main: string; decimal: string } {
  try {
    const parts = currencyFormatter(currency).formatToParts(amount);
    let main = '';
    let decimal = '';
    let inFraction = false;
    for (const part of parts) {
      if (part.type === 'decimal') inFraction = true;
      if (inFraction) decimal += part.value;
      else main += part.value;
    }
    return { main, decimal };
  } catch {
    const [whole, fraction = '00'] = amount.toFixed(2).split('.');
    return { main: `${currency} ${whole}`, decimal: `.${fraction}` };
  }
}
