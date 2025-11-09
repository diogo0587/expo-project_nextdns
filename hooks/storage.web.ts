const KEY = 'api-config';

export async function saveConfig(config: any) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(KEY, JSON.stringify(config));
    }
  } catch {
    // ignore
  }
}

export async function loadConfig<T = any>(): Promise<T | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const v = window.localStorage.getItem(KEY);
      if (!v) return null;
      return JSON.parse(v) as T;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearConfig() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(KEY);
    }
  } catch {
    // ignore
  }
}