import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { Store } from './models/Store.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import WalletTransaction from './models/WalletTransaction.js';
import { ChatSession } from './models/Chat.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';

async function cleanDatabase() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  try {
    console.log('Clearing chat sessions...');
    const chatResult = await ChatSession.deleteMany({});
    console.log(`Cleared ${chatResult.deletedCount} chat sessions.`);

    console.log('Clearing stores...');
    const storeResult = await Store.deleteMany({});
    console.log(`Cleared ${storeResult.deletedCount} stores.`);

    console.log('Clearing orders (parent and sub-orders)...');
    const orderResult = await Order.deleteMany({});
    console.log(`Cleared ${orderResult.deletedCount} orders.`);

    console.log('Clearing wallet transactions...');
    const walletResult = await WalletTransaction.deleteMany({});
    console.log(`Cleared ${walletResult.deletedCount} wallet transactions.`);

    console.log('Clearing vendor products...');
    const productResult = await Product.deleteMany({
      $or: [
        { store: { $ne: null } },
        { name: /Test Product/i }
      ]
    });
    console.log(`Cleared ${productResult.deletedCount} vendor/test products.`);

    console.log('Clearing test users (preserving admin and demo customer)...');
    const userResult = await User.deleteMany({
      email: { $nin: ['admin@admin.com', 'customer@demo.com'] }
    });
    console.log(`Cleared ${userResult.deletedCount} test/vendor users.`);

    console.log('\n=======================================');
    console.log('🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY! 🎉');
    console.log('=======================================');

  } catch (error) {
    console.error('❌ Cleanup Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

cleanDatabase();
