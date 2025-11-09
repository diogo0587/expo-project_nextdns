import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

type Props = {
  label: string;
  value: number;
  max: number;
};

export default function StatsBar({ label, value, max }: Props) {
  const pct = max > 0 ? value / max : 0;
  return (
    <ThemedView style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.barBg}>
        <View style={[styles.bar, { width: `${Math.min(100, pct * 100)}%` }]} />
      </View>
      <ThemedText style={styles.count}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    flex: 1,
  },
  barBg: {
    flex: 3,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  bar: {
    height: 12,
    backgroundColor: '#6aa9ff',
  },
  count: {
    width: 40,
    textAlign: 'right',
  },
});