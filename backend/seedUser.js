import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdminUser = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clean all users and stores before seeding
    await User.deleteMany();
    
    // Check if Store model exists and delete if so. We use dynamic import to avoid crashes if it's not yet needed.
    const { Store } = await import('./models/Store.js');
    await Store.deleteMany();
    console.log('Cleared existing Users and Stores');

    // 1. Admin
    await User.create({
      name: 'Admin User',
      email: 'admin@admin.com',
      password: 'password',
      role: 'admin',
    });
    console.log('Admin user created (admin@admin.com / password)');

    // 2. Customer
    await User.create({
      name: 'Demo Customer',
      email: 'customer@demo.com',
      password: 'password',
      role: 'customer',
    });
    console.log('Demo customer created (customer@demo.com / password)');

    // 3. Vendor 1
    const vendor1 = await User.create({
      name: 'Tech Haven',
      email: 'techhaven@demo.com',
      password: 'password',
      role: 'vendor',
    });
    await Store.create({
      vendor: vendor1._id,
      name: 'Tech Haven Store',
      description: 'The best electronics and gadgets in town.',
      status: 'active',
    });
    console.log('Vendor 1 created (techhaven@demo.com / password)');

    // 4. Vendor 2
    const vendor2 = await User.create({
      name: 'Fashion Boutique',
      email: 'fashion@demo.com',
      password: 'password',
      role: 'vendor',
    });
    await Store.create({
      vendor: vendor2._id,
      name: 'Fashion Boutique',
      description: 'Trendy clothing and accessories.',
      status: 'active',
    });
    console.log('Vendor 2 created (fashion@demo.com / password)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedAdminUser();
