import React, { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApiConfig } from '@/hooks/apiContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SettingsScreen() {
  const { config, setConfig, resetConfig } = useApiConfig();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'dark'].tint;

  const inputStyle = useMemo(
    () => [styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }],
    [tint, colorScheme]
  );

  return (
    <ThemedView style={{ padding: 16, gap: 12 }}>
      <ThemedText type="title">Settings</ThemedText>

      <ThemedText type="subtitle">NextDNS</ThemedText>
      <TextInput
        placeholder="NextDNS API Key"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={config.nextdnsApiKey}
        onChangeText={(v) => setConfig({ nextdnsApiKey: v })}
        style={inputStyle}
      />
      <TextInput
        placeholder="NextDNS Profile ID"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={config.nextdnsProfileId}
        onChangeText={(v) => setConfig({ nextdnsProfileId: v })}
        style={inputStyle}
      />

      <ThemedText type="subtitle">Gemini</ThemedText>
      <TextInput
        placeholder="Gemini API Key"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={config.geminiApiKey}
        onChangeText={(v) => setConfig({ geminiApiKey: v })}
        style={inputStyle}
      />
      <TextInput
        placeholder="Gemini Model (optional)"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={config.geminiModel}
        onChangeText={(v) => setConfig({ geminiModel: v })}
        style={inputStyle}
      />

      <Pressable
        onPress={resetConfig}
        style={[styles.button, { borderColor: tint, alignSelf: 'flex-start' }]}
      >
        <ThemedText>Reset (Clear SecureStore)</ThemedText>
      </Pressable>

      <ThemedText style={{ opacity: 0.7 }}>
        Keys are securely persisted using Expo SecureStore.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  input: {
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
});