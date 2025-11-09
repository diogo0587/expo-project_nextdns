import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNextDNS, NextDNSLog } from '@/hooks/useNextDNS';
import { useGemini } from '@/hooks/useGemini';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LogsScreen() {
  const { fetchLogs } = useNextDNS();
  const { summarizeText } = useGemini();
  const colorScheme = useColorScheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<NextDNSLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const tint = Colors[colorScheme ?? 'dark'].tint;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLogs({ q: query, limit: 50, sort: 'desc' });
      setLogs(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = ({ item }: { item: NextDNSLog }) => (
    <ThemedView style={styles.logItem}>
      <ThemedText type="defaultSemiBold">{item.domain}</ThemedText>
      <ThemedText>{new Date(item.time).toLocaleString()}</ThemedText>
      {item.action && <ThemedText>Action: {item.action}</ThemedText>}
      {item.client && <ThemedText>Client: {item.client}</ThemedText>}
      {item.resolved && <ThemedText>Resolved: {item.resolved}</ThemedText>}
    </ThemedView>
  );

  const summaryInput = useMemo(() => {
    const head = 'Summarize the following NextDNS logs. Identify blocked domains, frequent clients, and any security concerns:\n\n';
    const text = logs
      .slice(0, 50)
      .map((l) => `${l.time} | ${l.action ?? ''} | ${l.domain} | ${l.client ?? ''}`)
      .join('\n');
    return head + text;
  }, [logs]);

  const onSummarize = async () => {
    setSummary(null);
    setLoading(true);
    setError(null);
    try {
      const out = await summarizeText(summaryInput);
      setSummary(out);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxLike>
      <ThemedView style={styles.searchRow}>
        <TextInput
          placeholder="Search logs (domain, client...)"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
        />
        <Pressable onPress={load} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Search</ThemedText>
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <ThemedView style={styles.summaryBox}>
        <Pressable onPress={onSummarize} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Summarize with Gemini</ThemedText>
        </Pressable>
        {summary && <ThemedText>{summary}</ThemedText>}
      </ThemedView>
    </ParallaxLike>
  );
}

function ParallaxLike({ children }: { children: React.ReactNode }) {
  // Simple wrapper to keep consistent spacing without adding new deps or components
  return <ThemedView style={{ paddingHorizontal: 16, paddingVertical: 12 }}>{children}</ThemedView>;
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  summaryBox: {
    gap: 8,
    marginTop: 12,
  },
});