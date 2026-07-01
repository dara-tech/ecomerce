import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as jose from 'jose';

const TELEGRAM_OIDC_ISSUER = 'https://oauth.telegram.org';
const TELEGRAM_JWKS = jose.createRemoteJWKSet(
  new URL(`${TELEGRAM_OIDC_ISSUER}/.well-known/jwks.json`)
);

function getTelegramOidcClientId() {
  return process.env.TELEGRAM_OIDC_CLIENT_ID || process.env.TELEGRAM_BOT_TOKEN?.split(':')[0] || '';
}

function getTelegramOidcClientSecret() {
  return process.env.TELEGRAM_OIDC_CLIENT_SECRET || '';
}

export async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('Google sign-in is not configured');
    err.status = 503;
    throw err;
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    return null;
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || '',
    emailVerified: payload.email_verified === true,
  };
}

export function verifyTelegramLogin(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    const err = new Error('Telegram sign-in is not configured');
    err.status = 503;
    throw err;
  }

  if (!data?.hash || !data?.id) {
    return null;
  }

  const authDate = Number(data.auth_date);
  if (!authDate || Date.now() / 1000 - authDate > 86400) {
    return null;
  }

  const { hash, ...rest } = data;
  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (computedHash !== hash) {
    return null;
  }

  const name =
    [rest.first_name, rest.last_name].filter(Boolean).join(' ') ||
    rest.username ||
    'Telegram User';

  return {
    telegramId: String(rest.id),
    username: rest.username ? String(rest.username) : '',
    name,
    avatar: rest.photo_url ? String(rest.photo_url) : '',
  };
}

export function telegramPlaceholderEmail(telegramId) {
  return `tg_${telegramId}@telegram.user`;
}

export async function verifyTelegramOidcCode({ code, codeVerifier, redirectUri }) {
  const clientId = getTelegramOidcClientId();
  const clientSecret = getTelegramOidcClientSecret();

  if (!clientId || !clientSecret) {
    const err = new Error('Telegram OIDC sign-in is not configured');
    err.status = 503;
    throw err;
  }

  if (!code || !codeVerifier || !redirectUri) {
    return null;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const tokenRes = await fetch(`${TELEGRAM_OIDC_ISSUER}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  const tokens = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !tokens?.id_token) {
    console.error('Telegram OIDC token error:', tokens);
    return null;
  }

  const { payload } = await jose.jwtVerify(tokens.id_token, TELEGRAM_JWKS, {
    issuer: TELEGRAM_OIDC_ISSUER,
    audience: clientId,
  });

  const telegramId = payload.id != null ? String(payload.id) : String(payload.sub || '');
  if (!telegramId) {
    return null;
  }

  const name =
    (typeof payload.name === 'string' && payload.name) ||
    [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
    (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
    'Telegram User';

  return {
    telegramId,
    username:
      typeof payload.preferred_username === 'string' ? payload.preferred_username : '',
    name,
    avatar: typeof payload.picture === 'string' ? payload.picture : '',
  };
}
