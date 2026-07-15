import mongoose from 'mongoose';
import Order from './models/Order.js';
import { Store } from './models/Store.js'; // Need to import Store so it's registered

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce').then(async () => {
  const orders = await Order.find();
  console.log('Total Orders in DB:', orders.length);
  orders.forEach(o => {
    console.log(`Order ID: ${o._id}, Is Parent: ${!o.parentOrder}, Total Price: ${o.totalPrice}, Paid: ${o.isPaid}, Vendor Earnings: ${o.vendorEarnings}`);
  });
  
  const stores = await Store.find();
  console.log('Total Stores:', stores.length);
  stores.forEach(s => {
    console.log(`Store: ${s.name}, Balance: ${s.balance}, Total Earned: ${s.totalEarned}`);
  });
  process.exit();
}).catch(console.error);
