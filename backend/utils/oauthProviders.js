import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

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
