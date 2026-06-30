import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, required: true, index: true },
    success: { type: Boolean, required: true },
    failureReason: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    deviceLabel: { type: String, default: '' },
    location: { type: String, default: '' },
    twoFactorUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;
