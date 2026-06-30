import Session from '../models/Session.js';
import {
  generateRefreshTokenValue,
  hashToken,
  generateAccessToken,
  getRefreshExpiryDate,
} from '../utils/tokens.js';
import { getClientIp, getUserAgent, parseDeviceLabel } from '../utils/requestMeta.js';

export async function createSession(userId, req) {
  const refreshToken = generateRefreshTokenValue();
  const session = await Session.create({
    user: userId,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: getUserAgent(req),
    ip: getClientIp(req),
    deviceLabel: parseDeviceLabel(getUserAgent(req)),
    expiresAt: getRefreshExpiryDate(),
    lastUsedAt: new Date(),
  });

  const accessToken = generateAccessToken(userId, session._id);
  return { accessToken, refreshToken, session };
}

export async function refreshSession(refreshToken, req) {
  const hash = hashToken(refreshToken);
  const session = await Session.findOne({
    refreshTokenHash: hash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw new Error('Invalid or expired refresh token');
  }

  session.isRevoked = true;
  await session.save();

  return createSession(session.user, req);
}

export async function revokeSession(sessionId, userId) {
  const session = await Session.findOne({ _id: sessionId, user: userId });
  if (!session) return null;
  session.isRevoked = true;
  await session.save();
  return session;
}

export async function revokeAllSessions(userId, exceptSessionId = null) {
  const query = { user: userId, isRevoked: false };
  if (exceptSessionId) {
    query._id = { $ne: exceptSessionId };
  }
  await Session.updateMany(query, { isRevoked: true });
}

export async function getUserSessions(userId) {
  return Session.find({
    user: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ lastUsedAt: -1 });
}

export async function touchSession(sessionId) {
  await Session.findByIdAndUpdate(sessionId, { lastUsedAt: new Date() });
}

export function formatSessionResponse(session, currentSessionId) {
  return {
    _id: session._id,
    deviceLabel: session.deviceLabel,
    ip: session.ip,
    userAgent: session.userAgent,
    lastUsedAt: session.lastUsedAt,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    isCurrent: String(session._id) === String(currentSessionId),
  };
}
