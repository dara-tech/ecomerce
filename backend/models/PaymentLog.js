import mongoose from 'mongoose';

const paymentLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    gateway: {
      type: String,
      required: true,
      enum: ['Stripe', 'ABA Pay', 'KHQR', 'Wing', 'ACLEDA', 'Cash on Delivery'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    transactionId: {
      type: String,
    },
    webhookData: {
      type: mongoose.Schema.Types.Mixed, // Stores the raw JSON payload for debugging
    },
    errorMessage: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);

export default PaymentLog;
