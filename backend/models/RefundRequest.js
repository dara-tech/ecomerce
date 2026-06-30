import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentLog',
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema);

export default RefundRequest;
