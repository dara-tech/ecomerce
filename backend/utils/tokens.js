import crypto from 'crypto';
import jwt from 'jsonwebtoken';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'fallback_secret';
}

function getJwtRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || `${getJwtSecret()}_refresh`;
}

export function getAccessTokenExpiry() {
  return process.env.JWT_ACCESS_EXPIRY || '15m';
}

export function getRefreshTokenDays() {
  return parseInt(process.env.JWT_REFRESH_DAYS || '7', 10);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('hex');
}

export function generateAccessToken(userId, sessionId) {
  return jwt.sign({ id: userId, sid: sessionId }, getJwtSecret(), {
    expiresIn: getAccessTokenExpiry(),
  });
}

export function generateTemp2FAToken(userId) {
  return jwt.sign({ id: userId, purpose: '2fa_login' }, getJwtSecret(), {
    expiresIn: '5m',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function verifyTemp2FAToken(token) {
  const decoded = jwt.verify(token, getJwtSecret());
  if (decoded.purpose !== '2fa_login') {
    throw new Error('Invalid token purpose');
  }
  return decoded;
}

export function getRefreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + getRefreshTokenDays());
  return d;
}

/** @deprecated use generateAccessToken */
export default function generateToken(id) {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
}

export { getJwtSecret, getJwtRefreshSecret };
