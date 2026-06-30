import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit', 'loyalty_earn', 'loyalty_redeem'], required: true },
    amount: { type: Number, required: true },
    points: { type: Number, default: 0 },
    description: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;
