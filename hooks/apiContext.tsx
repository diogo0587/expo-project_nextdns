import React, { createContext, useContext, useMemo, useState } from 'react';

type ApiConfig = {
  nextdnsApiKey: string;
  nextdnsProfileId: string;
  geminiApiKey: string;
  geminiModel: string;
};

type ApiContextValue = {
  config: ApiConfig;
  setConfig: (partial: Partial<ApiConfig>) => void;
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
});

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<ApiConfig>(defaultConfig);

  const setConfig = (partial: Partial<ApiConfig>) =>
    setConfigState((prev) => ({ ...prev, ...partial }));

  const value = useMemo(
    () => ({
      config,
      setConfig,
    }),
    [config]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiConfig() {
  return useContext(ApiContext);
}