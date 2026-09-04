import React, { ReactNode } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { formatCurrencyParts } from '@/utils/currency';

type CurrencyTextProps = {
  amount: number;
  currency?: string;
  mainStyle?: StyleProp<TextStyle>;
  decimalStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<TextStyle>;
  // Extra nested Text rendered right after the decimal, in the same text
  // flow — e.g. a muted " / target" suffix on an overview stat.
  children?: ReactNode;
};

// A prominent money figure ("LKR 43,050.00") split into two visual weights:
// the whole-number part carries the size/weight passed via mainStyle, the
// trailing ".00" renders in decimalStyle (expected to be smaller + muted) —
// so a long balance reads as "43,050" at a glance instead of every digit
// competing equally. Reserved for hero/stat figures; list rows use the
// plain formatCurrency string instead.
export default function CurrencyText({ amount, currency = 'USD', mainStyle, decimalStyle, containerStyle, children }: CurrencyTextProps) {
  const { main, decimal } = formatCurrencyParts(amount, currency);
  return (
    // Kept to one line and shrunk to fit rather than wrapped/truncated — at
    // a maxed-out system font-scale setting, a long grouped figure ("LKR
    // 1,234,567.00") would otherwise wrap onto a second line or overlap
    // whatever sits next to it (a chevron, a trend badge, an adjacent card).
    <Text style={containerStyle} numberOfLines={1} adjustsFontSizeToFit>
      <Text style={mainStyle}>{main}</Text>
      {decimal ? <Text style={decimalStyle}>{decimal}</Text> : null}
      {children}
    </Text>
  );
}
