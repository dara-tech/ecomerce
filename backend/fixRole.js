import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomerce')
  .then(async () => {
    const email = 'daracheol@gmail.com';
    const user = await User.findOne({ email });
    console.log('User role:', user?.role);
    if (user && user.role === 'customer') {
      user.role = 'vendor';
      await user.save();
      console.log('Updated user role to vendor!');
    }
    process.exit(0);
  });
