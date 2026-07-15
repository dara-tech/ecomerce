import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Store',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'rejected'],
      default: 'pending',
    },
    method: {
      type: String,
      required: true,
    },
    paymentDetails: {
      type: String, // e.g. bank account info, paypal email provided at request time
    },
    adminNotes: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    transactionId: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);
export default PayoutRequest;
