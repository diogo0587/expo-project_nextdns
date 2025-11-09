import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApiConfig } from '@/hooks/apiContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNextDNS } from '@/hooks/useNextDNS';

export default function SettingsScreen() {
  const { config, setConfig, resetConfig } = useApiConfig();
  const { listProfiles } = useNextDNS();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'dark'].tint;

  const inputStyle = useMemo(
    () => [styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }],
    [tint, colorScheme]
  );

  // local inputs for new profile
  const [newProfileId, setNewProfileId] = useState('');
  const [newProfileName, setNewProfileName] = useState('');

  const addProfile = () => {
    if (!newProfileId) return;
    const next = [...(config.profiles ?? []), { id: newProfileId, name: newProfileName || undefined }];
    setConfig({ profiles: next, currentProfileId: newProfileId });
    setNewProfileId('');
    setNewProfileName('');
  };

  const removeProfile = (id: string) => {
    const next = (config.profiles ?? []).filter((p) => p.id !== id);
    const newCurrent = config.currentProfileId === id ? (next[0]?.id ?? '') : config.currentProfileId;
    setConfig({ profiles: next, currentProfileId: newCurrent });
  };

  const selectProfile = (id: string) => setConfig({ currentProfileId: id });

  const importProfiles = async () => {
    try {
      const profiles = await listProfiles();
      if (profiles?.length) {
        setConfig({
          profiles,
          currentProfileId: profiles[0].id,
        });
      }
    } catch {
      // no-op, stay silent
    }
  };

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
        placeholder="Default Profile ID (legacy)"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={config.nextdnsProfileId}
        onChangeText={(v) => setConfig({ nextdnsProfileId: v })}
        style={inputStyle}
      />

      <ThemedText type="subtitle">Profiles</ThemedText>
      <View style={styles.row}>
        <TextInput
          placeholder="Profile ID"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={newProfileId}
          onChangeText={setNewProfileId}
          style={inputStyle}
        />
        <TextInput
          placeholder="Name (optional)"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={newProfileName}
          onChangeText={setNewProfileName}
          style={inputStyle}
        />
      </View>
      <View style={styles.row}>
        <Pressable onPress={addProfile} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Add Profile</ThemedText>
        </Pressable>
        <Pressable onPress={importProfiles} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Import from NextDNS</ThemedText>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        {config.profiles?.length ? (
          config.profiles.map((p) => (
            <View key={p.id} style={styles.row}>
              <Pressable
                onPress={() => selectProfile(p.id)}
                style={[
                  styles.button,
                  {
                    borderColor: tint,
                    backgroundColor: (config.currentProfileId || config.nextdnsProfileId) === p.id ? '#222' : 'transparent',
                  },
                ]}
              >
                <ThemedText>{p.name || p.id}</ThemedText>
              </Pressable>
              <Pressable onPress={() => removeProfile(p.id)} style={[styles.button, { borderColor: tint }]}>
                <ThemedText>Remove</ThemedText>
              </Pressable>
            </View>
          ))
        ) : (
          <ThemedText style={{ opacity: 0.7 }}>No profiles yet</ThemedText>
        )}
      </View>

      <ThemedText type="subtitle">Timezone</ThemedText>
      <TextInput
        placeholder="Timezone (IANA, e.g., UTC, America/Sao_Paulo)"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={config.timeZone}
        onChangeText={(v) => setConfig({ timeZone: v })}
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
        Keys and settings are securely persisted using Expo SecureStore.
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
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});