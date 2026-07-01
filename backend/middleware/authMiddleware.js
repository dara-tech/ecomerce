import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getPermissionsForRole, roleHasPermission } from '../config/permissions.js';
import { touchSession } from '../services/sessionService.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      if (req.user.status === 'banned') {
        return res.status(403).json({ message: 'Account is banned' });
      }

      req.sessionId = decoded.sid || null;
      if (req.sessionId) {
        touchSession(req.sessionId).catch(() => {});
      }

      return next();
    } catch (error) {
      if (error.name !== 'TokenExpiredError') {
        console.error(error);
      }
      const message =
        error.name === 'TokenExpiredError'
          ? 'Session expired, please log in again'
          : 'Not authorized, token failed';
      return res.status(401).json({ message });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

/** Sets req.user when a valid token is present; continues as guest otherwise */
export const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    /* guest */
  }
  return next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export const staff = (req, res, next) => {
  if (req.user && ['admin', 'manager', 'support'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized for admin panel' });
  }
};

export function authorize(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const rolePerms = getPermissionsForRole(req.user.role);
    const allPerms = [...new Set([...rolePerms, ...(req.user.customPermissions || [])])];

    if (req.user.role === 'admin') {
      return next();
    }

    const allowed = permissions.some((p) => allPerms.includes(p));
    if (!allowed) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export function getUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'admin') return getPermissionsForRole('admin');
  return [...new Set([...getPermissionsForRole(user.role), ...(user.customPermissions || [])])];
}

export { roleHasPermission };
