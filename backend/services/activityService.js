import ActivityLog from '../models/ActivityLog.js';
import { getClientIp, getUserAgent } from '../utils/requestMeta.js';

export async function logActivity({
  req,
  user,
  action,
  resource = '',
  resourceId = '',
  details = {},
  status = 'success',
}) {
  try {
    await ActivityLog.create({
      user: user?._id,
      userEmail: user?.email || '',
      userRole: user?.role || '',
      action,
      resource,
      resourceId: String(resourceId || ''),
      details,
      ip: req ? getClientIp(req) : '',
      userAgent: req ? getUserAgent(req) : '',
      status,
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
}

export async function getActivityLogs({ page = 1, limit = 50, action, userId }) {
  const query = {};
  if (action) query.action = action;
  if (userId) query.user = userId;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email role'),
    ActivityLog.countDocuments(query),
  ]);

  return { logs, total, page, pages: Math.ceil(total / limit) };
}
