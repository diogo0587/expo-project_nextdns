import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { saveConfig, loadConfig, clearConfig } from './storage';

type Profile = {
  id: string;
  name?: string;
};

type ApiConfig = {
  nextdnsApiKey: string;
  // Backwards-compatible single profile id
  nextdnsProfileId: string;
  // Multi-profile support
  profiles: Profile[];
  currentProfileId: string;
  // Timezone for queries
  timeZone: string;
  // Gemini
  geminiApiKey: string;
  geminiModel: string;
};

type ApiContextValue = {
  config: ApiConfig;
  setConfig: (partial: Partial<ApiConfig>) => void;
  resetConfig: () => void;
};

const defaultConfig: ApiConfig = {
  nextdnsApiKey: '',
  nextdnsProfileId: '',
  profiles: [],
  currentProfileId: '',
  timeZone: 'UTC',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash-latest',
};

const ApiContext = createContext<ApiContextValue>({
  config: defaultConfig,
  // no-op default; real implementation provided in provider
  setConfig: () => {},
  resetConfig: () => {},
});

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<ApiConfig>(defaultConfig);

  useEffect(() => {
    (async () => {
      const existing = await loadConfig<ApiConfig>();
      if (existing) setConfigState((prev) => ({ ...prev, ...existing }));
    })();
  }, []);

  const setConfig = (partial: Partial<ApiConfig>) =>
    setConfigState((prev) => {
      const next = { ...prev, ...partial };
      // If next.currentProfileId is empty but next.profiles has entries, default to first
      if (!next.currentProfileId && next.profiles?.length) {
        next.currentProfileId = next.profiles[0].id;
      }
      // persist
      saveConfig(next);
      return next;
    });

  const resetConfig = () => {
    setConfigState(defaultConfig);
    clearConfig();
  };

  const value = useMemo(
    () => ({
      config,
      setConfig,
      resetConfig,
    }),
    [config]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiConfig() {
  return useContext(ApiContext);
}