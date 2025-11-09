import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNextDNS, NextDNSLog } from '@/hooks/useNextDNS';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function StreamScreen() {
  const { fetchLogs, streamLogs } = useNextDNS();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'dark'].tint;
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<NextDNSLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const streamId = useRef<string | null>(null);
  const [running, setRunning] = useState(false);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLogs({ limit: 1, sort: 'desc' });
      streamId.current = res.id;
      setLogs(res.data ?? []);
      setRunning(true);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!running || !streamId.current) return;
      try {
        const res = await streamLogs(streamId.current);
        if (cancelled) return;
        if (res.data?.length) {
          setLogs((prev) => [...res.data, ...prev].slice(0, 200));
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? String(e));
      } finally {
        if (!cancelled) setTimeout(tick, 1500);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [running, streamLogs]);

  return (
    <ThemedView style={{ padding: 16 }}>
      <ThemedView style={styles.row}>
        <Pressable onPress={start} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Start Stream</ThemedText>
        </Pressable>
        <Pressable onPress={() => setRunning(false)} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Stop</ThemedText>
        </Pressable>
      </ThemedView>

      {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}
      {error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText type="defaultSemiBold">Error</ThemedText>
          <ThemedText>{error}</ThemedText>
        </ThemedView>
      )}

      <FlatList
        data={logs}
        keyExtractor={(item, idx) => item.id + ':' + idx}
        renderItem={({ item }) => (
          <ThemedView style={styles.logItem}>
            <ThemedText type="defaultSemiBold">{item.domain}</ThemedText>
            <ThemedText>{new Date(item.time).toLocaleString()}</ThemedText>
            {item.action && <ThemedText>Action: {item.action}</ThemedText>}
            {item.client && <ThemedText>Client: {item.client}</ThemedText>}
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logItem: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#a00',
    backgroundColor: '#220000',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    gap: 4,
  },
});