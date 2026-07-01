import { getApiUrl } from '@/lib/api';

type StoredUser = {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  token: string;
  refreshToken?: string;
};

type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler | null = null;
let onTokenRefreshed: ((user: StoredUser) => void) | null = null;

export function registerSessionHandlers(handlers: {
  onExpired: SessionExpiredHandler;
  onRefreshed?: (user: StoredUser) => void;
}) {
  onSessionExpired = handlers.onExpired;
  onTokenRefreshed = handlers.onRefreshed ?? null;
}

export function clearSessionHandlers() {
  onSessionExpired = null;
  onTokenRefreshed = null;
}

function readStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('userInfo');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: StoredUser) {
  localStorage.setItem('userInfo', JSON.stringify(user));
  if (user.refreshToken) {
    localStorage.setItem('refreshToken', user.refreshToken);
  }
}

function getRefreshToken(user: StoredUser | null) {
  return user?.refreshToken || localStorage.getItem('refreshToken') || '';
}

export async function refreshAccessToken(): Promise<StoredUser | null> {
  const current = readStoredUser();
  const refreshToken = getRefreshToken(current);
  if (!refreshToken) return null;

  const res = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const token = data.accessToken || data.token;
  if (!token || !current) return null;

  const nextUser: StoredUser = {
    ...current,
    token,
    refreshToken: data.refreshToken || current.refreshToken,
  };
  writeStoredUser(nextUser);
  onTokenRefreshed?.(nextUser);
  return nextUser;
}

export function triggerSessionExpired() {
  onSessionExpired?.();
}

export function isApiRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh') || url.includes('/auth/google') || url.includes('/auth/telegram')) {
    return false;
  }
  return url.includes('/api/') || url.includes(getApiUrl());
}

/** Fetch with Bearer token; on 401 tries refresh once, then logs out. */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  token?: string
): Promise<Response> {
  const user = readStoredUser();
  const accessToken = token || user?.token;
  const headers = new Headers(init.headers);
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status !== 401 || !isApiRequest(input)) {
    return response;
  }

  if (headers.get('X-Auth-Retry') === '1') {
    triggerSessionExpired();
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    triggerSessionExpired();
    return response;
  }

  headers.set('Authorization', `Bearer ${refreshed.token}`);
  headers.set('X-Auth-Retry', '1');
  response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    triggerSessionExpired();
  }

  return response;
}

export async function validateStoredSession(): Promise<'valid' | 'refreshed' | 'expired' | 'none'> {
  const user = readStoredUser();
  if (!user?.token) return 'none';

  const res = await fetch(`${getApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });

  if (res.ok) return 'valid';

  if (res.status !== 401) return 'valid';

  const refreshed = await refreshAccessToken();
  if (!refreshed) return 'expired';

  const retry = await fetch(`${getApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${refreshed.token}` },
  });

  return retry.ok ? 'refreshed' : 'expired';
}
