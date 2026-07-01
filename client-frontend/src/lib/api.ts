const LOCAL_DEFAULT = '/api';
const SERVER_DEFAULT =
  process.env.BACKEND_PROXY_URL || 'http://107.175.91.211/ecomerce/api';

/**
 * API base URL for fetch calls.
 * - Browser: uses NEXT_PUBLIC_API_URL (prefer `/api` — proxied by Next/Vercel)
 * - Server/build: uses BACKEND_PROXY_URL when public URL is relative
 * - On HTTPS production, never call http://127.0.0.1 from the browser
 */
export function getApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || LOCAL_DEFAULT).replace(/\/$/, '');

  if (typeof window === 'undefined') {
    if (configured.startsWith('/')) {
      return SERVER_DEFAULT.replace(/\/$/, '');
    }
    return configured;
  }

  if (
    window.location.protocol === 'https:' &&
    configured.startsWith('http://')
  ) {
    return '/api';
  }

  return configured.startsWith('/') ? configured : configured;
}
