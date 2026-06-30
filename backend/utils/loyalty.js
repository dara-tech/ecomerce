import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';

/** Award loyalty points once per paid order (10 pts per $1) */
export async function awardLoyaltyPoints(order) {
  if (!order?.isPaid || !order.user) return;

  const existing = await WalletTransaction.findOne({
    order: order._id,
    type: 'loyalty_earn',
  });
  if (existing) return;

  const user = await User.findById(order.user);
  if (!user) return;

  const points = Math.max(1, Math.floor(order.totalPrice * 10));
  user.loyaltyPoints += points;
  await user.save();

  await WalletTransaction.create({
    user: user._id,
    type: 'loyalty_earn',
    amount: 0,
    points,
    order: order._id,
    description: `Earned ${points} loyalty points`,
  });
}
