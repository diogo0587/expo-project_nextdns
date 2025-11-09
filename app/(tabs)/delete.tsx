import React, { useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNextDNS } from '@/hooks/useNextDNS';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DeleteScreen() {
  const { deleteLogs } = useNextDNS();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'dark'].tint;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    Alert.alert(
      'Delete all logs',
      'Are you sure you want to delete all logs for this profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setLoading(true);
            try {
              await deleteLogs();
              Alert.alert('Success', 'Logs deleted.');
            } catch (e: any) {
              setError(e.message ?? String(e));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={{ padding: 16, gap: 12 }}>
      <ThemedText type="title">Delete Logs</ThemedText>
      <ThemedText>This will delete all logs from your NextDNS profile.</ThemedText>
      <Pressable onPress={onDelete} style={[styles.button, { borderColor: tint }]}>
        <ThemedText>Delete All Logs</ThemedText>
      </Pressable>
      {loading && <ActivityIndicator />}
      {error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText type="defaultSemiBold">Error</ThemedText>
          <ThemedText>{error}</ThemedText>
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
});