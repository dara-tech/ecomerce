import express from 'express';
import {
  authUser,
  registerUser,
  googleAuth,
  telegramAuth,
  getUserProfile,
  updateUserProfile,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
  verify2FALogin,
  getSessions,
  revokeUserSession,
  getLoginHistory,
  getAuditLogs,
  setup2FA,
  enable2FA,
  disable2FA,
  getRolesInfo,
} from '../controllers/authController.js';
import { protect, admin, staff, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/google', googleAuth);
router.post('/telegram', telegramAuth);
router.post('/2fa/verify-login', verify2FALogin);
router.post('/refresh', refreshAccessToken);

router.get('/me', protect, getUserProfile);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.post('/logout', protect, logoutUser);
router.post('/logout-all', protect, logoutAllSessions);

router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeUserSession);

router.get('/login-history', protect, getLoginHistory);
router.get('/activity-logs', protect, authorize('audit:read'), getAuditLogs);

router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);

router.get('/roles', protect, staff, getRolesInfo);

export default router;
