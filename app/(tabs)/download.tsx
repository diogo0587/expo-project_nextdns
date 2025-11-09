import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNextDNS } from '@/hooks/useNextDNS';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as WebBrowser from 'expo-web-browser';

export default function DownloadScreen() {
  const { getDownloadUrl } = useNextDNS();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'dark'].tint;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const onDownload = async () => {
    setLoading(true);
    setError(null);
    setUrl(null);
    try {
      const res = await getDownloadUrl({ redirect: 0 });
      setUrl(res.url);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const open = async () => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  return (
    <ThemedView style={{ padding: 16, gap: 12 }}>
      <ThemedText type="title">Download Logs</ThemedText>
      <ThemedText>Get a downloadable link to your NextDNS logs file.</ThemedText>
      <Pressable onPress={onDownload} style={[styles.button, { borderColor: tint }]}>
        <ThemedText>Get Link</ThemedText>
      </Pressable>

      {loading && <ActivityIndicator />}
      {error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText type="defaultSemiBold">Error</ThemedText>
          <ThemedText>{error}</ThemedText>
        </ThemedView>
      )}
      {url && (
        <ThemedView style={styles.linkBox}>
          <ThemedText selectable>{url}</ThemedText>
          <Pressable onPress={open} style={[styles.button, { borderColor: tint }]}>
            <ThemedText>Open</ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#a00',
    backgroundColor: '#220000',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  linkBox: {
    gap: 8,
  },
});