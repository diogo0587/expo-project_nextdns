import * as SecureStore from 'expo-secure-store';

const KEY = 'api-config';

export async function saveConfig(config: any) {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(config));
  } catch {
    // Let errors propagate via caller if needed; keep minimal handling
  }
}

export async function loadConfig<T = any>(): Promise<T | null> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (!v) return null;
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

export async function clearConfig() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}