const LOCAL_DEFAULT = 'http://127.0.0.1:5001/api';
const SERVER_DEFAULT =
  process.env.BACKEND_PROXY_URL || 'http://107.175.91.211/ecomerce/api';

/**
 * API base URL for fetch calls.
 * - Browser: uses NEXT_PUBLIC_API_URL (e.g. `/api` via Vercel rewrite)
 * - Server/build: uses BACKEND_PROXY_URL (absolute URL — relative paths break Node fetch)
 */
export function getApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || LOCAL_DEFAULT).replace(/\/$/, '');

  if (typeof window === 'undefined') {
    if (configured.startsWith('/')) {
      return SERVER_DEFAULT.replace(/\/$/, '');
    }
    return configured;
  }

  return configured;
}
