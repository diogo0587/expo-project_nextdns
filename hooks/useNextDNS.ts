import { useCallback } from 'react';
import { useApiConfig } from './apiContext';

const BASE_URL = 'https://api.nextdns.io';

export type NextDNSLog = {
  id: string;
  time: string; // ISO8601
  domain: string;
  client?: string;
  protocol?: string;
  action?: string; // allowed/blocked/rewrite
  resolved?: string;
};

type LogsQuery = {
  from?: string;
  to?: string;
  q?: string; // search
  limit?: number;
  sort?: 'asc' | 'desc';
  cursor?: string;
  profileIdOverride?: string;
  tz?: string;
};

function withAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function useNextDNS() {
  const {
    config: { nextdnsApiKey, nextdnsProfileId, currentProfileId, timeZone },
  } = useApiConfig();

  const ensureConfig = useCallback(() => {
    if (!nextdnsApiKey || !(currentProfileId || nextdnsProfileId)) {
      throw new Error('Configure NextDNS API key and Profile ID in Settings.');
    }
  }, [nextdnsApiKey, currentProfileId, nextdnsProfileId]);

  const resolvedProfile = (override?: string) =>
    override ?? currentProfileId ?? nextdnsProfileId;

  const fetchLogs = useCallback(
    async (params: LogsQuery = {}) => {
      ensureConfig();
      const profile = resolvedProfile(params.profileIdOverride);
      const qs = new URLSearchParams();
      if (params.from) qs.append('from', params.from);
      if (params.to) qs.append('to', params.to);
      if (params.q) qs.append('q', params.q);
      if (params.limit) qs.append('limit', String(params.limit));
      if (params.sort) qs.append('sort', params.sort);
      if (params.cursor) qs.append('cursor', params.cursor);
      const tz = params.tz ?? timeZone;
      if (tz) qs.append('timezone', tz);
      const url = `${BASE_URL}/profiles/${profile}/logs?${qs.toString()}`;
      const res = await fetch(url, {
        headers: withAuthHeaders(nextdnsApiKey),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`NextDNS logs error (${res.status}): ${text}`);
      }
      return (await res.json()) as { id: string; data: NextDNSLog[]; cursor?: string };
    },
    [ensureConfig, nextdnsApiKey, resolvedProfile, timeZone]
  );

  const streamLogs = useCallback(
    async (id: string, params: Omit<LogsQuery, 'from' | 'to' | 'sort' | 'limit' | 'cursor'> = {}) => {
      ensureConfig();
      const profile = resolvedProfile(params.profileIdOverride);
      const qs = new URLSearchParams();
      if (params.q) qs.append('q', params.q);
      const tz = params.tz ?? timeZone;
      if (tz) qs.append('timezone', tz);
      const url = `${BASE_URL}/profiles/${profile}/logs/stream?id=${encodeURIComponent(id)}&${qs.toString()}`;
      const res = await fetch(url, {
        headers: withAuthHeaders(nextdnsApiKey),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`NextDNS stream error (${res.status}): ${text}`);
      }
      return (await res.json()) as { data: NextDNSLog[] };
    },
    [ensureConfig, nextdnsApiKey, resolvedProfile, timeZone]
  );

  const getDownloadUrl = useCallback(
    async (params: { redirect?: 0 | 1 } = { redirect: 0 }) => {
      ensureConfig();
      const profile = resolvedProfile();
      const qs = new URLSearchParams();
      if (params.redirect !== undefined) qs.append('redirect', String(params.redirect));
      if (timeZone) qs.append('timezone', timeZone);
      const url = `${BASE_URL}/profiles/${profile}/logs/download?${qs.toString()}`;
      const res = await fetch(url, {
        headers: withAuthHeaders(nextdnsApiKey),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`NextDNS download error (${res.status}): ${text}`);
      }
      return (await res.json()) as { url: string };
    },
    [ensureConfig, nextdnsApiKey, resolvedProfile, timeZone]
  );

  const deleteLogs = useCallback(async () => {
    ensureConfig();
    const profile = resolvedProfile();
    const url = `${BASE_URL}/profiles/${profile}/logs`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: withAuthHeaders(nextdnsApiKey),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`NextDNS delete error (${res.status}): ${text}`);
    }
    return true;
  }, [ensureConfig, nextdnsApiKey, resolvedProfile]);

  return {
    fetchLogs,
    streamLogs,
    getDownloadUrl,
    deleteLogs,
  };
}