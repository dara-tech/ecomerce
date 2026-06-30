import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import User from './models/User.js';
import {
  ShippingZone,
  ShippingMethod,
  Warehouse,
  Supplier,
  Coupon,
  Review,
  AdminNotification,
  NotificationSettings,
} from './models/OpsModels.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';

const seedOps = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for ops seeding');

  const admin = await User.findOne({ role: 'admin' });
  const customer =
    (await User.findOne({ email: 'customer@demo.com' })) ||
    (await User.findOne({ role: 'customer' }));

  let warehouse = await Warehouse.findOne({ code: 'PP-MAIN' });
  if (!warehouse) {
    warehouse = await Warehouse.create({
      name: 'Phnom Penh Main',
      code: 'PP-MAIN',
      address: 'Street 240, Phnom Penh',
      city: 'Phnom Penh',
      country: 'Cambodia',
      isDefault: true,
      isActive: true,
    });
    console.log('Created default warehouse');
  }

  let zone = await ShippingZone.findOne({ name: 'Cambodia' });
  if (!zone) {
    zone = await ShippingZone.create({
      name: 'Cambodia',
      countries: ['KH'],
      regions: ['Phnom Penh', 'Siem Reap'],
      isActive: true,
    });
    console.log('Created shipping zone');
  }

  const methodCount = await ShippingMethod.countDocuments();
  if (methodCount === 0) {
    await ShippingMethod.insertMany([
      {
        name: 'Standard Delivery',
        zone: zone._id,
        type: 'flat',
        baseFee: 2.5,
        minDays: 2,
        maxDays: 4,
        warehouse: warehouse._id,
        isActive: true,
      },
      {
        name: 'Express Delivery',
        zone: zone._id,
        type: 'flat',
        baseFee: 5,
        minDays: 1,
        maxDays: 2,
        warehouse: warehouse._id,
        isActive: true,
      },
      {
        name: 'Free Shipping',
        zone: zone._id,
        type: 'free',
        baseFee: 0,
        freeAbove: 50,
        minDays: 3,
        maxDays: 5,
        warehouse: warehouse._id,
        isActive: true,
      },
    ]);
    console.log('Created shipping methods');
  }

  const supplierCount = await Supplier.countDocuments();
  if (supplierCount === 0) {
    await Supplier.insertMany([
      {
        name: 'Tech Wholesale Co.',
        email: 'orders@techwholesale.example',
        phone: '+855 12 345 678',
        address: 'Phnom Penh',
        isActive: true,
      },
      {
        name: 'Fashion Import Ltd.',
        email: 'hello@fashionimport.example',
        phone: '+855 98 765 432',
        isActive: true,
      },
    ]);
    console.log('Created suppliers');
  }

  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 3);
    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        name: 'Welcome 10% Off',
        type: 'percent',
        value: 10,
        minOrderAmount: 20,
        usageLimit: 500,
        perCustomerLimit: 1,
        expiresAt: expires,
        isActive: true,
      },
      {
        code: 'FLAT5',
        name: '$5 Off Orders',
        type: 'fixed',
        value: 5,
        minOrderAmount: 30,
        usageLimit: 200,
        perCustomerLimit: 2,
        expiresAt: expires,
        isActive: true,
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        type: 'free_shipping',
        value: 0,
        minOrderAmount: 40,
        usageLimit: 100,
        perCustomerLimit: 1,
        expiresAt: expires,
        isActive: true,
      },
    ]);
    console.log('Created coupons');
  }

  const settings = await NotificationSettings.findOne();
  if (!settings) {
    await NotificationSettings.create({
      emailEnabled: true,
      smsEnabled: false,
      telegramEnabled: false,
      notifyNewOrder: true,
      notifyRefundRequest: true,
      notifyLowStock: true,
      notifyNewCustomer: true,
      lowStockThreshold: 5,
    });
    console.log('Created notification settings');
  }

  const reviewCount = await Review.countDocuments();
  if (reviewCount === 0 && customer) {
    const products = await Product.find().limit(5);
    if (products.length) {
      await Review.insertMany(
        products.map((product, i) => ({
          product: product._id,
          user: customer._id,
          name: customer.name || 'Demo Customer',
          rating: 4 + (i % 2),
          comment: `Great quality — really happy with ${product.name}.`,
          status: i % 2 === 0 ? 'approved' : 'pending',
        }))
      );
      console.log('Created sample reviews');
    }
  }

  const notifCount = await AdminNotification.countDocuments();
  if (notifCount === 0) {
    await AdminNotification.insertMany([
      {
        type: 'system',
        title: 'Store seeded successfully',
        message: 'Demo data is ready. Log in as admin@admin.com to manage the store.',
        link: '/',
        isRead: false,
      },
      {
        type: 'low_stock',
        title: 'Low stock alert',
        message: 'Some products are running low. Check inventory.',
        link: '/inventory',
        isRead: false,
      },
    ]);
    console.log('Created admin notifications');
  }

  console.log('Ops seed complete');
};

seedOps()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Ops seed failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
