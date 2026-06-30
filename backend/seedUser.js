import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdminUser = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@admin.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@admin.com',
        password: 'password',
        role: 'admin',
      });
      console.log('Admin user created (admin@admin.com / password)');
    } else {
      console.log('Admin user already exists');
    }

    const customerExists = await User.findOne({ email: 'customer@demo.com' });
    if (!customerExists) {
      await User.create({
        name: 'Demo Customer',
        email: 'customer@demo.com',
        password: 'password',
        role: 'customer',
      });
      console.log('Demo customer created (customer@demo.com / password)');
    } else {
      console.log('Demo customer already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdminUser();
