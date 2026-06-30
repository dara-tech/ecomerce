import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    resource: { type: String, default: '' },
    resourceId: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
