import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    deviceLabel: { type: String, default: 'Unknown device' },
    expiresAt: { type: Date, required: true, index: true },
    lastUsedAt: { type: Date, default: Date.now },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, isRevoked: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
