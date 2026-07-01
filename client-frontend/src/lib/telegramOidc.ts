const PKCE_STORAGE_KEY = "telegram_oidc_pkce";

type PkceSession = {
  state: string;
  codeVerifier: string;
  redirectUri: string;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function pkceChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function getTelegramOidcClientId() {
  return (
    process.env.NEXT_PUBLIC_TELEGRAM_OIDC_CLIENT_ID ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ||
    ""
  );
}

export function getTelegramCallbackUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/telegram/callback`;
}

export function saveTelegramPkceSession(session: PkceSession) {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(session));
}

export function loadTelegramPkceSession(): PkceSession | null {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PkceSession;
  } catch {
    return null;
  }
}

export function clearTelegramPkceSession() {
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
}

export async function startTelegramOidcLogin() {
  const clientId = getTelegramOidcClientId();
  if (!clientId) {
    throw new Error("Telegram login is not configured.");
  }

  const redirectUri = getTelegramCallbackUrl();
  const state = randomString(32);
  const codeVerifier = randomString(48);
  const codeChallenge = await pkceChallenge(codeVerifier);

  saveTelegramPkceSession({ state, codeVerifier, redirectUri });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.href = `https://oauth.telegram.org/auth?${params.toString()}`;
}

export function isTelegramOidcConfigured() {
  return Boolean(getTelegramOidcClientId());
}
