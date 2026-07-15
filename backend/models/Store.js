import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
    commissionRate: {
      type: Number,
      default: 10.0, // Default 10% platform fee
    },
    balance: {
      type: Number,
      default: 0.0,
    },
    totalEarned: {
      type: Number,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model('Store', storeSchema);
export { Store };
