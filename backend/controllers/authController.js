import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import { generateTemp2FAToken, verifyTemp2FAToken } from '../utils/tokens.js';
import { createSession, refreshSession, revokeSession, revokeAllSessions, getUserSessions, formatSessionResponse } from '../services/sessionService.js';
import { logActivity, getActivityLogs } from '../services/activityService.js';
import { getClientIp, getUserAgent, parseDeviceLabel } from '../utils/requestMeta.js';
import { getUserPermissions } from '../middleware/authMiddleware.js';
import { canAccessAdminPanel, getPermissionsForRole, PERMISSIONS, ROLE_PERMISSIONS } from '../config/permissions.js';
import { seedAdminNotification } from './opsController.js';
import {
  verifyGoogleCredential,
  verifyTelegramLogin,
  verifyTelegramOidcCode,
  telegramPlaceholderEmail,
} from '../utils/oauthProviders.js';

function oauthRandomPassword() {
  return crypto.randomBytes(32).toString('hex');
}

async function finalizeOAuthLogin(req, res, user, action) {
  if (user.status === 'banned') {
    await recordLoginAttempt({
      user,
      email: user.email,
      success: false,
      req,
      failureReason: 'Account banned',
    });
    return res.status(403).json({ message: 'Account is banned' });
  }

  if (user.twoFactorEnabled && canAccessAdminPanel(user.role)) {
    return res.status(400).json({
      message: 'Staff accounts with 2FA must sign in via the admin portal.',
    });
  }

  user.lastLogin = new Date();
  await user.save();
  await recordLoginAttempt({ user, email: user.email, success: true, req });
  await logActivity({ req, user, action });
  await issueTokensResponse(res, user, req);
}

async function findOrCreateGoogleUser(profile) {
  let user = await User.findOne({ googleId: profile.googleId });
  if (user) return { user, isNew: false };

  user = await User.findOne({ email: profile.email });
  if (user) {
    if (!user.googleId) {
      user.googleId = profile.googleId;
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
      }
      if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
      if (profile.emailVerified) user.isEmailVerified = true;
      await user.save();
    }
    return { user, isNew: false };
  }

  user = await User.create({
    name: profile.name,
    email: profile.email,
    password: oauthRandomPassword(),
    googleId: profile.googleId,
    authProviders: ['google'],
    avatar: profile.avatar,
    isEmailVerified: profile.emailVerified,
    role: 'customer',
  });

  return { user, isNew: true };
}

async function findOrCreateTelegramUser(profile) {
  let user = await User.findOne({ telegramId: profile.telegramId });
  if (user) {
    if (profile.avatar && !user.avatar) {
      user.avatar = profile.avatar;
      await user.save();
    }
    return { user, isNew: false };
  }

  const email = telegramPlaceholderEmail(profile.telegramId);

  user = await User.create({
    name: profile.name,
    email,
    password: oauthRandomPassword(),
    telegramId: profile.telegramId,
    telegramUsername: profile.username,
    authProviders: ['telegram'],
    avatar: profile.avatar,
    isEmailVerified: false,
    role: 'customer',
  });

  return { user, isNew: true };
}

function formatUser(user, permissions) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: user.lastLogin,
    addresses: user.addresses || [],
    permissions,
    canAccessAdmin: canAccessAdminPanel(user.role),
  };
}

function issueTokensResponse(res, user, req, statusCode = 200) {
  return createSession(user._id, req).then(({ accessToken, refreshToken, session }) => {
    const permissions = getUserPermissions(user);
    res.status(statusCode).json({
      ...formatUser(user, permissions),
      token: accessToken,
      accessToken,
      refreshToken,
      sessionId: session._id,
    });
  });
}

async function recordLoginAttempt({ user, email, success, req, failureReason = '', twoFactorUsed = false }) {
  await LoginHistory.create({
    user: user?._id,
    email,
    success,
    failureReason,
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    deviceLabel: parseDeviceLabel(getUserAgent(req)),
    twoFactorUsed,
  });
}

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function verify2FACode(user, code) {
  if (!code) return false;

  const userWithSecret = await User.findById(user._id).select('+twoFactorSecret +twoFactorBackupCodes');
  if (!userWithSecret?.twoFactorSecret) return false;

  if (verifySync({ secret: userWithSecret.twoFactorSecret, token: String(code).replace(/\s/g, '') }).valid) {
    return true;
  }

  const hashed = hashBackupCode(code.replace(/\s/g, '').toUpperCase());
  const idx = userWithSecret.twoFactorBackupCodes.indexOf(hashed);
  if (idx >= 0) {
    userWithSecret.twoFactorBackupCodes.splice(idx, 1);
    await userWithSecret.save();
    return true;
  }

  return false;
}

// @desc    Login
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      await recordLoginAttempt({ email, success: false, req, failureReason: 'Invalid credentials' });
      await logActivity({ req, action: 'auth.login_failed', details: { email }, status: 'failure' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      await recordLoginAttempt({ user, email, success: false, req, failureReason: 'Account banned' });
      return res.status(403).json({ message: 'Account is banned' });
    }

    if (user.twoFactorEnabled) {
      const tempToken = generateTemp2FAToken(user._id);
      return res.json({
        requires2FA: true,
        tempToken,
        message: 'Two-factor authentication required',
      });
    }

    user.lastLogin = new Date();
    await user.save();
    await recordLoginAttempt({ user, email, success: true, req });
    await logActivity({ req, user, action: 'auth.login' });

    await issueTokensResponse(res, user, req);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// @desc    Complete login with 2FA
export const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    const decoded = verifyTemp2FAToken(tempToken);
    const user = await User.findById(decoded.id);

    if (!user || user.status === 'banned') {
      return res.status(401).json({ message: 'Invalid login session' });
    }

    const valid = await verify2FACode(user, code);
    if (!valid) {
      await recordLoginAttempt({ user, email: user.email, success: false, req, failureReason: 'Invalid 2FA code' });
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    user.lastLogin = new Date();
    await user.save();
    await recordLoginAttempt({ user, email: user.email, success: true, req, twoFactorUsed: true });
    await logActivity({ req, user, action: 'auth.login_2fa' });

    await issueTokensResponse(res, user, req);
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired 2FA session' });
  }
};

// @desc    Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role: 'customer' });
    await logActivity({ req, user, action: 'auth.register' });
    seedAdminNotification(
      'new_customer',
      'New customer registered',
      `${name} (${email}) joined the store`,
      '/users',
      { userId: user._id }
    ).catch(() => {});
    await issueTokensResponse(res, user, req, 201);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Invalid user data' });
  }
};

// @desc    Google OAuth (ID token from Google Identity Services)
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const profile = await verifyGoogleCredential(credential);
    if (!profile) {
      return res.status(401).json({ message: 'Invalid Google sign-in' });
    }

    const { user, isNew } = await findOrCreateGoogleUser(profile);

    if (isNew) {
      seedAdminNotification(
        'new_customer',
        'New customer registered',
        `${user.name} (${user.email}) joined via Google`,
        '/users',
        { userId: user._id }
      ).catch(() => {});
    }

    await finalizeOAuthLogin(req, res, user, isNew ? 'auth.register_google' : 'auth.login_google');
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Google sign-in failed',
    });
  }
};

// @desc    Telegram Login Widget
export const telegramAuth = async (req, res) => {
  try {
    const profile = verifyTelegramLogin(req.body);
    if (!profile) {
      return res.status(401).json({ message: 'Invalid Telegram sign-in' });
    }

    const { user, isNew } = await findOrCreateTelegramUser(profile);

    if (isNew) {
      seedAdminNotification(
        'new_customer',
        'New customer registered',
        `${user.name} joined via Telegram`,
        '/users',
        { userId: user._id }
      ).catch(() => {});
    }

    await finalizeOAuthLogin(req, res, user, isNew ? 'auth.register_telegram' : 'auth.login_telegram');
  } catch (err) {
    console.error('Telegram auth error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Telegram sign-in failed',
    });
  }
};

// @desc    Telegram OpenID Connect (BotFather Web Login)
export const telegramOidcAuth = async (req, res) => {
  try {
    const { code, codeVerifier, redirectUri } = req.body;
    const profile = await verifyTelegramOidcCode({ code, codeVerifier, redirectUri });
    if (!profile) {
      return res.status(401).json({ message: 'Invalid Telegram sign-in' });
    }

    const { user, isNew } = await findOrCreateTelegramUser(profile);

    if (isNew) {
      seedAdminNotification(
        'new_customer',
        'New customer registered',
        `${user.name} joined via Telegram`,
        '/users',
        { userId: user._id }
      ).catch(() => {});
    }

    await finalizeOAuthLogin(req, res, user, isNew ? 'auth.register_telegram' : 'auth.login_telegram');
  } catch (err) {
    console.error('Telegram OIDC auth error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Telegram sign-in failed',
    });
  }
};

// @desc    Refresh access token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const { accessToken, refreshToken: newRefresh, session } = await refreshSession(refreshToken, req);
    const user = await User.findById(session.user);

    res.json({
      token: accessToken,
      accessToken,
      refreshToken: newRefresh,
      sessionId: session._id,
      permissions: getUserPermissions(user),
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Logout current session
export const logoutUser = async (req, res) => {
  if (req.sessionId) {
    await revokeSession(req.sessionId, req.user._id);
  }
  await logActivity({ req, user: req.user, action: 'auth.logout' });
  res.json({ message: 'Logged out' });
};

// @desc    Logout all sessions
export const logoutAllSessions = async (req, res) => {
  await revokeAllSessions(req.user._id, req.sessionId);
  await logActivity({ req, user: req.user, action: 'auth.logout_all' });
  res.json({ message: 'All other sessions revoked' });
};

// @desc    Get profile
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(formatUser(user, getUserPermissions(user)));
};

// @desc    Update profile
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
  if (req.body.password) user.password = req.body.password;
  if (req.body.addresses) user.addresses = req.body.addresses;

  const updated = await user.save();
  await logActivity({ req, user, action: 'auth.profile_update' });
  await issueTokensResponse(res, updated, req);
};

// @desc    List active sessions
export const getSessions = async (req, res) => {
  const sessions = await getUserSessions(req.user._id);
  res.json(sessions.map((s) => formatSessionResponse(s, req.sessionId)));
};

// @desc    Revoke a session
export const revokeUserSession = async (req, res) => {
  const session = await revokeSession(req.params.id, req.user._id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  await logActivity({ req, user: req.user, action: 'auth.session_revoke', resourceId: req.params.id });
  res.json({ message: 'Session revoked' });
};

// @desc    Login history
export const getLoginHistory = async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const query = req.user.role === 'admin' && req.query.userId
    ? { user: req.query.userId }
    : { user: req.user._id };

  const [history, total] = await Promise.all([
    LoginHistory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LoginHistory.countDocuments(query),
  ]);

  res.json({ history, total, page, pages: Math.ceil(total / limit) });
};

// @desc    Activity audit logs
export const getAuditLogs = async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '50', 10);
  const data = await getActivityLogs({
    page,
    limit,
    action: req.query.action,
    userId: req.query.userId,
  });
  res.json(data);
};

// @desc    Setup 2FA — returns secret + otpauth URL
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    const secret = generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const otpauthUrl = generateURI({ issuer: 'E-Commerce Admin', label: user.email, secret });
    res.json({ secret, otpauthUrl });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ message: err.message || '2FA setup failed' });
  }
};

// @desc    Enable 2FA after verifying code
export const enable2FA = async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');

  if (!user.twoFactorSecret) {
    return res.status(400).json({ message: 'Run 2FA setup first' });
  }

  if (!verifySync({ secret: user.twoFactorSecret, token: String(code).replace(/\s/g, '') }).valid) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  user.twoFactorBackupCodes = backupCodes.map(hashBackupCode);
  user.twoFactorEnabled = true;
  await user.save();

  await logActivity({ req, user, action: 'security.2fa_enabled' });
  res.json({ message: '2FA enabled', backupCodes });
};

// @desc    Disable 2FA
export const disable2FA = async (req, res) => {
  const { code, password } = req.body;
  const user = await User.findById(req.user._id).select('+password +twoFactorSecret +twoFactorBackupCodes');

  if (!(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const valid = await verify2FACode(user, code);
  if (!valid) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = [];
  await user.save();

  await logActivity({ req, user, action: 'security.2fa_disabled' });
  res.json({ message: '2FA disabled' });
};

// @desc    RBAC roles & permissions reference
export const getRolesInfo = async (req, res) => {
  res.json({
    permissions: PERMISSIONS,
    rolePermissions: ROLE_PERMISSIONS,
  });
};
