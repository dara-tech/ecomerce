import mongoose from 'mongoose';
import Order from './models/Order.js';
import { Store } from './models/Store.js';
import WalletTransaction from './models/WalletTransaction.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce').then(async () => {
  // Find paid child orders where vendorEarnings > 0
  const paidChildOrders = await Order.find({ parentOrder: { $exists: true, $ne: null }, isPaid: true, vendorEarnings: { $gt: 0 } });
  
  for (const order of paidChildOrders) {
    if (order.store) {
      const store = await Store.findById(order.store);
      if (store) {
        // Check if wallet transaction exists
        const exists = await WalletTransaction.findOne({ order: order._id, type: 'credit' });
        if (!exists) {
          // It was paid but wallet transaction is missing!
          await WalletTransaction.create({
            user: store.vendor,
            type: 'credit',
            amount: order.vendorEarnings,
            description: `Earnings for multi-vendor order sub-order #${order._id.toString().slice(-8)} (Retroactive)`,
            order: order._id,
          });
          
          store.balance += order.vendorEarnings;
          store.totalEarned += order.vendorEarnings;
          await store.save();
          console.log(`Fixed balance for store ${store.name}. Added $${order.vendorEarnings}`);
        } else {
           // Wallet transaction exists, but let's make sure the balance actually reflects it
           if (store.totalEarned < order.vendorEarnings) {
             store.balance += order.vendorEarnings;
             store.totalEarned += order.vendorEarnings;
             await store.save();
             console.log(`Synced balance for store ${store.name}. Added $${order.vendorEarnings}`);
           }
        }
      }
    }
  }
  
  console.log('Done!');
  process.exit();
}).catch(console.error);
