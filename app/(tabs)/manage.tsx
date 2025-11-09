import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNextDNS } from '@/hooks/useNextDNS';
import { useApiConfig } from '@/hooks/apiContext';

type Section = 'allowlist' | 'denylist' | 'rewrites' | 'settings';

export default function ManageScreen() {
  const { getAllowlist, setAllowlist, getDenylist, setDenylist, getRewrites, addRewrite, removeRewrite, listProfiles,} =
    useNextDNS();
  const { config, setConfig } = useApiConfig();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'dark'].tint;

  const [section, setSection] = useState<Section>('allowlist');

  const [allowlist, setAllowlistState] = useState<string[]>([]);
  const [denylist, setDenylistState] = useState<string[]>([]);
  const [rewrites, setRewritesState] = useState<{ id: string; domain: string; answer: string }[]>([]);

  const [newDomain, setNewDomain] = useState('');
  const [newBlockDomain, setNewBlockDomain] = useState('');
  const [newRewriteDomain, setNewRewriteDomain] = useState('');
  const [newRewriteAnswer, setNewRewriteAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced settings editor
  const [settingsSegment, setSettingsSegment] = useState('settings');
  const [settingsBody, setSettingsBody] = useState('{\n  \n}');

  const inputStyle = useMemo(
    () => [styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text }],
    [tint, colorScheme]
  );

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [al, dl, rw] = await Promise.all([getAllowlist(), getDenylist(), getRewrites()]);
      setAllowlistState(al);
      setDenylistState(dl);
      setRewritesState(rw);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.currentProfileId]);

  const addAllowed = async () => {
    if (!newDomain) return;
    const next = Array.from(new Set([...allowlist, newDomain.trim()]));
    setLoading(true);
    setError(null);
    try {
      await setAllowlist(next);
      setNewDomain('');
      setAllowlistState(next);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const removeAllowed = async (domain: string) => {
    const next = allowlist.filter((d) => d !== domain);
    setLoading(true);
    setError(null);
    try {
      await setAllowlist(next);
      setAllowlistState(next);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const addDenied = async () => {
    if (!newBlockDomain) return;
    const next = Array.from(new Set([...denylist, newBlockDomain.trim()]));
    setLoading(true);
    setError(null);
    try {
      await setDenylist(next);
      setNewBlockDomain('');
      setDenylistState(next);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const removeDenied = async (domain: string) => {
    const next = denylist.filter((d) => d !== domain);
    setLoading(true);
    setError(null);
    try {
      await setDenylist(next);
      setDenylistState(next);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const addRw = async () => {
    if (!newRewriteDomain || !newRewriteAnswer) return;
    setLoading(true);
    setError(null);
    try {
      const created = await addRewrite(newRewriteDomain.trim(), newRewriteAnswer.trim());
      setRewritesState((prev) => [created, ...prev]);
      setNewRewriteDomain('');
      setNewRewriteAnswer('');
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const removeRw = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await removeRewrite(id);
      setRewritesState((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const importProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const profiles = await listProfiles();
      if (profiles?.length) {
        setConfig({
          profiles,
          currentProfileId: profiles[0].id,
        });
      }
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={{ padding: 16, gap: 12 }}>
      <ThemedText type="title">Manage NextDNS</ThemedText>

      <ThemedView style={styles.row}>
        <SectionButton label="Allowlist" active={section === 'allowlist'} onPress={() => setSection('allowlist')} tint={tint} />
        <SectionButton label="Denylist" active={section === 'denylist'} onPress={() => setSection('denylist')} tint={tint} />
        <SectionButton label="Rewrites" active={section === 'rewrites'} onPress={() => setSection('rewrites')} tint={tint} />
        <SectionButton label="Settings" active={section === 'settings'} onPress={() => setSection('settings')} tint={tint} />
        <Pressable onPress={importProfiles} style={[styles.button, { borderColor: tint }]}>
          <ThemedText>Import Profiles</ThemedText>
        </Pressable>
      </ThemedView>

      {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}
      {error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText type="defaultSemiBold">Error</ThemedText>
          <ThemedText>{error}</ThemedText>
        </ThemedView>
      )}

      {section === 'allowlist' && (
        <ThemedView style={{ gap: 8 }}>
          <ThemedText type="subtitle">Allowlist</ThemedText>
          <View style={styles.row}>
            <TextInput placeholder="domain.com" placeholderTextColor="#888" value={newDomain} onChangeText={setNewDomain} style={inputStyle} />
            <Pressable onPress={addAllowed} style={[styles.button, { borderColor: tint }]}>
              <ThemedText>Add</ThemedText>
            </Pressable>
          </View>

          <FlatList
            data={allowlist}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <ThemedView style={styles.listItem}>
                <ThemedText>{item}</ThemedText>
                <Pressable onPress={() => removeAllowed(item)} style={[styles.button, { borderColor: tint }]}>
                  <ThemedText>Remove</ThemedText>
                </Pressable>
              </ThemedView>
            )}
          />
        </ThemedView>
      )}

      {section === 'denylist' && (
        <ThemedView style={{ gap: 8 }}>
          <ThemedText type="subtitle">Denylist</ThemedText>
          <View style={styles.row}>
            <TextInput
              placeholder="bad-domain.com"
              placeholderTextColor="#888"
              value={newBlockDomain}
              onChangeText={setNewBlockDomain}
              style={inputStyle}
            />
            <Pressable onPress={addDenied} style={[styles.button, { borderColor: tint }]}>
              <ThemedText>Add</ThemedText>
            </Pressable>
          </View>

          <FlatList
            data={denylist}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <ThemedView style={styles.listItem}>
                <ThemedText>{item}</ThemedText>
                <Pressable onPress={() => removeDenied(item)} style={[styles.button, { borderColor: tint }]}>
                  <ThemedText>Remove</ThemedText>
                </Pressable>
              </ThemedView>
            )}
          />
        </ThemedView>
      )}

      {section === 'rewrites' && (
        <ThemedView style={{ gap: 8 }}>
          <ThemedText type="subtitle">Rewrites</ThemedText>
          <View style={styles.row}>
            <TextInput placeholder="domain.com" placeholderTextColor="#888" value={newRewriteDomain} onChangeText={setNewRewriteDomain} style={inputStyle} />
            <TextInput placeholder="answer (IP or name)" placeholderTextColor="#888" value={newRewriteAnswer} onChangeText={setNewRewriteAnswer} style={inputStyle} />
            <Pressable onPress={addRw} style={[styles.button, { borderColor: tint }]}>
              <ThemedText>Add</ThemedText>
            </Pressable>
          </View>

          <FlatList
            data={rewrites}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ThemedView style={styles.listItem}>
                <ThemedText type="defaultSemiBold">{item.domain}</ThemedText>
                <ThemedText>{item.answer}</ThemedText>
                <Pressable onPress={() => removeRw(item.id)} style={[styles.button, { borderColor: tint }]}>
                  <ThemedText>Remove</ThemedText>
                </Pressable>
              </ThemedView>
            )}
          />
        </ThemedView>
      )}

      {section === 'settings' && (
        <ThemedView style={{ gap: 8 }}>
          <ThemedText type="subtitle">Advanced Settings</ThemedText>
          <ThemedText style={{ opacity: 0.7 }}>
            Provide a segment (e.g., "settings", "settings/performance") and a JSON body to PATCH.
          </ThemedText>
          <View style={styles.row}>
            <TextInput
              placeholder="Segment, e.g. settings/performance"
              placeholderTextColor="#888"
              value={settingsSegment}
              onChangeText={setSettingsSegment}
              style={inputStyle}
            />
          </View>
          <TextInput
            placeholder="{ ... }"
            placeholderTextColor="#888"
            value={settingsBody}
            onChangeText={setSettingsBody}
            style={[styles.input, { borderColor: tint, color: Colors[colorScheme ?? 'dark'].text, minHeight: 140 }]}
            multiline
          />
          <Pressable
            onPress={async () => {
              setLoading(true);
              setError(null);
              try {
                const parsed = JSON.parse(settingsBody);
                await patchSettings(settingsSegment, parsed);
              } catch (e: any) {
                setError(e.message ?? String(e));
              } finally {
                setLoading(false);
              }
            }}
            style={[styles.button, { borderColor: tint, alignSelf: 'flex-start' }]}
          >
            <ThemedText>Apply PATCH</ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </ThemedView>
  );
}

function SectionButton({
  label,
  active,
  onPress,
  tint,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          borderColor: tint,
          backgroundColor: active ? '#222' : 'transparent',
        },
      ]}>
      <ThemedText>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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