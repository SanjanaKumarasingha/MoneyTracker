import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type CalculatorProps = {
  onKeyPress: (key: string) => void;
};

// Native re-implementation of the concept in
// Client/src/components/calculator/Calculator.tsx: a custom on-screen
// numeric keypad (rather than the OS keyboard) for entering a record's
// amount, including a basic arithmetic "=" key.
const KEY_ROWS: string[][] = [
  ['AC', 'DE', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function Calculator({ onKeyPress }: CalculatorProps) {
  return (
    <View style={styles.grid}>
      {KEY_ROWS.flat().map((key) => (
        <Pressable
          key={key}
          onPress={() => onKeyPress(key)}
          style={({ pressed }) => [
            styles.key,
            (key === 'AC' || key === '=') && styles.keyWide,
            pressed && styles.keyPressed,
          ]}
        >
          <Text style={styles.keyText}>{key === '*' ? '×' : key}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  keyWide: {
    flexBasis: '48%',
  },
  keyPressed: {
    backgroundColor: colors.border,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
