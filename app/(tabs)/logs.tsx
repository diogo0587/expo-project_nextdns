import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNextDNS, NextDNSLog } from '@/hooks/useNextDNS';
import { useGemini } from '@/hooks/useGemini';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApiConfig } from '@/hooks/apiContext';
import StatsBar from '@/components/StatsBar';

export default function LogsScreen() {
  const { fetchLogs } = useNextDNS();
  const { summarizeText } = useGemini();
  const { config, setConfig } = useApiConfig();
  const colorScheme = useColorScheme();
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [action, setAction] = useState('');
  const [client, setClient] = useState('');
  const [limit, setLimit] = useState('50');
  const [timeZone, setTimeZone] = useState(config.timeZone);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<NextDNSLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const tint = Colors[colorScheme ?? 'dark'].tint;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // persist tz for future calls
      if (timeZone && timeZone !== config.timeZone) setConfig({ timeZone });
      const qParts = [];
      if (query) qParts.push(query);
      if (action) qParts.push(`action:${action}`);
      if (client) qParts.push(`client:${client}`);
      const res = await fetchLogs({
        q: qParts.join(' '),
        from: from || undefined,
        to: to || undefined,
        limit: Number(limit) || 50,
        sort: 'desc',
        tz: timeZone || undefined,
      });
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
    const head = 'Summarize the following NextDNS logs. Identify blocked domains, frequent clients, and any security concerns:\\n\\n';
    const text = logs
      .slice(0, 100)
      .map((l) => `${l.time} | ${l.action ?? ''} | ${l.domain} | ${l.client ?? ''}`)
      .join('\\n');
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

  const exportCsv = async () => {
    try {
      const header = 'time,action,domain,client,resolved\\n';
      const rows = logs
        .map((l) =>
          [
            JSON.stringify(l.time ?? ''),
            JSON.stringify(l.action ?? ''),
            JSON.stringify(l.domain ?? ''),
            JSON.stringify(l.client ?? ''),
            JSON.stringify(l.resolved ?? ''),
          ].join(',')
        )
        .join('\\n');
      const csv = header + rows;

      if (Platform.OS === 'web') {
        // Use browser APIs to trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nextdns_logs.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const fileUri = FileSystem.documentDirectory + 'nextdns_logs.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  };

  const selectProfile = (id: string) => {
    setConfig({ currentProfileId: id });
    // refresh with selected profile
    load();
  };

  // Stats
  const stats = useMemo(() => {
    const domainCounts: Record<string, number> = {};
    const clientCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    logs.forEach((l) => {
      domainCounts[l.domain] = (domainCounts[l.domain] || 0) + 1;
      if (l.client) clientCounts[l.client] = (clientCounts[l.client] || 0) + 1;
      if (l.action) actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    });
    const topN = (obj: Record<string, number>, n = 5) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
    const topDomains = topN(domainCounts);
    const topClients = topN(clientCounts);
    const topActions = topN(actionCounts);
    return {
      topDomains,
      topClients,
      topActions,
      maxDomain: topDomains[0]?.[1] ?? 0,
      maxClient: topClients[0]?.[1] ?? 0,
      maxAction: topActions[0]?.[1] ?? 0,
    };
  }, [logs]);

  return (
    <ParallaxLike>
      <ThemedView style={styles.filters}>
        <ThemedText type="subtitle">Profile & Timezone</ThemedText>
        <View style={styles.row}>
          <FlatProfiles
            profiles={config.profiles}
            currentId={config.currentProfileId || config.nextdnsProfileId}
            onSelect={selectProfile}
          />
          <TextInput
            placeholder="Timezone (e.g., UTC, America/Sao_Paulo)"
            placeholderTextColor="#888"
            value={timeZone}
            onChangeText={setTimeZone}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
        </View>

        <ThemedText type="subtitle">Filters</ThemedText>
        <View style={styles.row}>
          <TextInput
            placeholder="Search (domain, client...)"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
          <TextInput
            placeholder="Action (allowed/blocked/rewrite)"
            placeholderTextColor="#888"
            value={action}
            onChangeText={setAction}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            placeholder="Client"
            placeholderTextColor="#888"
            value={client}
            onChangeText={setClient}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
          <TextInput
            placeholder="Limit"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={limit}
            onChangeText={setLimit}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            placeholder="From (ISO, unix, or -6h)"
            placeholderTextColor="#888"
            value={from}
            onChangeText={setFrom}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
          <TextInput
            placeholder="To (ISO, unix)"
            placeholderTextColor="#888"
            value={to}
            onChangeText={setTo}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }]}
          />
        </View>
        <View style={styles.row}>
          <Pressable onPress={load} style={[styles.button, { borderColor: tint }]}>
            <ThemedText>Apply</ThemedText>
          </Pressable>
          <Pressable onPress={exportCsv} style={[styles.button, { borderColor: tint }]}>
            <ThemedText>Export CSV</ThemedText>
          </Pressable>
          <Pressable onPress={onSummarize} style={[styles.button, { borderColor: tint }]}>
            <ThemedText>Summarize with Gemini</ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}
      {error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText type="defaultSemiBold">Error</ThemedText>
          <ThemedText>{error}</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={{ marginVertical: 8 }}>
        <ThemedText type="subtitle">Statistics</ThemedText>
        {stats.topActions.map(([label, count]) => (
          <StatsBar key={'a-' + label} label={`Action: ${label}`} value={count} max={stats.maxAction} />
        ))}
        {stats.topDomains.map(([label, count]) => (
          <StatsBar key={'d-' + label} label={label} value={count} max={stats.maxDomain} />
        ))}
        {stats.topClients.map(([label, count]) => (
          <StatsBar key={'c-' + label} label={`Client: ${label}`} value={count} max={stats.maxClient} />
        ))}
      </ThemedView>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </ParallaxLike>
  );
}

function FlatProfiles({
  profiles,
  currentId,
  onSelect,
}: {
  profiles: { id: string; name?: string }[];
  currentId?: string;
  onSelect: (id: string) => void;
}) {
  const tint = Colors['dark'].tint;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
      {profiles?.length ? (
        profiles.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            style={[
              styles.button,
              {
                borderColor: tint,
                backgroundColor: p.id === currentId ? '#222' : 'transparent',
              },
            ]}
          >
            <ThemedText>{p.name || p.id}</ThemedText>
          </Pressable>
        ))
      ) : (
        <ThemedText style={{ opacity: 0.7 }}>No profiles configured</ThemedText>
      )}
    </View>
  );
}

function ParallaxLike({ children }: { children: React.ReactNode }) {
  // Simple wrapper to keep consistent spacing without adding new deps or components
  return <ThemedView style={{ paddingHorizontal: 16, paddingVertical: 12 }}>{children}</ThemedView>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  filters: {
    gap: 8,
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
});