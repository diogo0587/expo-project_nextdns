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

type ProfileInfo = {
  id: string;
  name?: string;
};

type Rewrite = {
  id: string;
  domain: string;
  answer: string;
};

function withAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function request<T>(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NextDNS error (${res.status}): ${text}`);
  }
  // Some endpoints may return 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
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
      return await request<{ id: string; data: NextDNSLog[]; cursor?: string }>(url, {
        headers: withAuthHeaders(nextdnsApiKey),
      });
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
      return await request<{ data: NextDNSLog[] }>(url, {
        headers: withAuthHeaders(nextdnsApiKey),
      });
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
      return await request<{ url: string }>(url, {
        headers: withAuthHeaders(nextdnsApiKey),
      });
    },
    [ensureConfig, nextdnsApiKey, resolvedProfile, timeZone]
  );

  const deleteLogs = useCallback(async () => {
    ensureConfig();
    const profile = resolvedProfile();
    const url = `${BASE_URL}/profiles/${profile}/logs`;
    await request<void>(url, {
      method: 'DELETE',
      headers: withAuthHeaders(nextdnsApiKey),
    });
    return true;
  }, [ensureConfig, nextdnsApiKey, resolvedProfile]);

  // Profiles
  const listProfiles = useCallback(async () => {
    if (!nextdnsApiKey) throw new Error('Configure NextDNS API key in Settings.');
    const url = `${BASE_URL}/profiles`;
    return await request<ProfileInfo[]>(url, {
      headers: withAuthHeaders(nextdnsApiKey),
    });
  }, [nextdnsApiKey]);

  const getProfile = useCallback(async (profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}`;
    return await request<ProfileInfo>(url, {
      headers: withAuthHeaders(nextdnsApiKey),
    });
  }, [nextdnsApiKey, resolvedProfile]);

  // Allowlist / Denylist
  const getAllowlist = useCallback(async (profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/allowlist`;
    // Expect either array or { data: [] }
    const res = await request<any>(url, { headers: withAuthHeaders(nextdnsApiKey) });
    return Array.isArray(res) ? (res as string[]) : (res?.data as string[] ?? []);
  }, [nextdnsApiKey, resolvedProfile]);

  const setAllowlist = useCallback(async (domains: string[], profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/allowlist`;
    await request<void>(url, {
      method: 'PUT',
      headers: withAuthHeaders(nextdnsApiKey),
      body: JSON.stringify({ domains }),
    });
    return true;
  }, [nextdnsApiKey, resolvedProfile]);

  const getDenylist = useCallback(async (profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/denylist`;
    const res = await request<any>(url, { headers: withAuthHeaders(nextdnsApiKey) });
    return Array.isArray(res) ? (res as string[]) : (res?.data as string[] ?? []);
  }, [nextdnsApiKey, resolvedProfile]);

  const setDenylist = useCallback(async (domains: string[], profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/denylist`;
    await request<void>(url, {
      method: 'PUT',
      headers: withAuthHeaders(nextdnsApiKey),
      body: JSON.stringify({ domains }),
    });
    return true;
  }, [nextdnsApiKey, resolvedProfile]);

  // Rewrites
  const getRewrites = useCallback(async (profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/rewrites`;
    const res = await request<any>(url, { headers: withAuthHeaders(nextdnsApiKey) });
    return Array.isArray(res) ? (res as Rewrite[]) : (res?.data as Rewrite[] ?? []);
  }, [nextdnsApiKey, resolvedProfile]);

  const addRewrite = useCallback(async (domain: string, answer: string, profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/rewrites`;
    return await request<Rewrite>(url, {
      method: 'POST',
      headers: withAuthHeaders(nextdnsApiKey),
      body: JSON.stringify({ domain, answer }),
    });
  }, [nextdnsApiKey, resolvedProfile]);

  const removeRewrite = useCallback(async (id: string, profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const url = `${BASE_URL}/profiles/${profile}/rewrites/${encodeURIComponent(id)}`;
    await request<void>(url, {
      method: 'DELETE',
      headers: withAuthHeaders(nextdnsApiKey),
    });
    return true;
  }, [nextdnsApiKey, resolvedProfile]);

  // Advanced settings patch (generic)
  const patchSettings = useCallback(async (segment: string, body: any, profileId?: string) => {
    const profile = resolvedProfile(profileId);
    const seg = segment?.replace(/^\\/+|\\/+$/g, ''); // trim slashes
    const url = `${BASE_URL}/profiles/${profile}/${seg || 'settings'}`;
    await request<void>(url, {
      method: 'PATCH',
      headers: withAuthHeaders(nextdnsApiKey),
      body: JSON.stringify(body ?? {}),
    });
    return true;
  }, [nextdnsApiKey, resolvedProfile]);

  return {
    fetchLogs,
    streamLogs,
    getDownloadUrl,
    deleteLogs,
    // new:
    listProfiles,
    getProfile,
    getAllowlist,
    setAllowlist,
    getDenylist,
    setDenylist,
    getRewrites,
    addRewrite,
    removeRewrite,
    patchSettings,
  };
}