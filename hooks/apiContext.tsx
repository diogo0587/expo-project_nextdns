import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { saveConfig, loadConfig, clearConfig } from './storage';

type ApiConfig = {
  nextdnsApiKey: string;
  nextdnsProfileId: string;
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