import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { Store } from './models/Store.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import WalletTransaction from './models/WalletTransaction.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';

async function runTest() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  try {
    // 1. Clean up previous test entries if any
    console.log('Cleaning up previous test data...');
    await User.deleteMany({ email: /test_vendor_/ });
    await Store.deleteMany({ name: /Test Store/ });
    await Product.deleteMany({ name: /Test Product/ });
    await Order.deleteMany({ guestEmail: 'test_customer@example.com' });

    // 2. Create Vendor A & Store A
    console.log('Creating Vendor A & Store A...');
    const vendorA = await User.create({
      name: 'Vendor A User',
      email: 'test_vendor_a@example.com',
      password: 'password123',
      role: 'vendor',
    });
    const storeA = await Store.create({
      vendor: vendorA._id,
      name: 'Test Store A',
      description: 'Vendor A Shop',
      commissionRate: 10.0, // 10% platform fee
      status: 'active'
    });

    // 3. Create Vendor B & Store B
    console.log('Creating Vendor B & Store B...');
    const vendorB = await User.create({
      name: 'Vendor B User',
      email: 'test_vendor_b@example.com',
      password: 'password123',
      role: 'vendor',
    });
    const storeB = await Store.create({
      vendor: vendorB._id,
      name: 'Test Store B',
      description: 'Vendor B Shop',
      commissionRate: 15.0, // 15% platform fee
      status: 'active'
    });

    // 4. Create Product A & Product B
    console.log('Creating Products...');
    const productA = await Product.create({
      user: vendorA._id,
      store: storeA._id,
      name: 'Test Product A (Store A)',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      brand: 'TestBrand',
      category: 'Electronics',
      description: 'Description A',
      price: 10.0,
      countInStock: 20,
    });

    const productB = await Product.create({
      user: vendorB._id,
      store: storeB._id,
      name: 'Test Product B (Store B)',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      brand: 'TestBrand',
      category: 'Electronics',
      description: 'Description B',
      price: 25.0,
      countInStock: 10,
    });

    // 5. Simulate Checkout (Placing Parent Order with both products)
    console.log('Simulating placement of master checkout order...');
    const parentOrder = new Order({
      isGuest: true,
      guestEmail: 'test_customer@example.com',
      guestName: 'John Test Customer',
      shippingAddress: {
        address: '123 Test St',
        city: 'Phnom Penh',
        postalCode: '12000',
        country: 'Cambodia',
      },
      paymentMethod: 'Cash on Delivery',
      itemsPrice: 45.0, // (10 * 2) + (25 * 1)
      taxPrice: 0.0,
      shippingPrice: 5.0,
      totalPrice: 50.0,
      orderItems: [
        {
          name: productA.name,
          qty: 2,
          image: productA.image,
          price: productA.price,
          product: productA._id,
        },
        {
          name: productB.name,
          qty: 1,
          image: productB.image,
          price: productB.price,
          product: productB._id,
        }
      ],
    });

    const savedParentOrder = await parentOrder.save();
    console.log(`Parent Order created with ID: ${savedParentOrder._id}`);

    // Wait a brief second to let post-save split hooks finish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Verify Sub-Orders creation
    console.log('Verifying sub-orders...');
    const subOrders = await Order.find({ parentOrder: savedParentOrder._id });
    console.log(`Found ${subOrders.length} sub-orders.`);

    if (subOrders.length !== 2) {
      throw new Error(`Expected 2 sub-orders, but found ${subOrders.length}`);
    }

    const subOrderA = subOrders.find(s => s.store.toString() === storeA._id.toString());
    const subOrderB = subOrders.find(s => s.store.toString() === storeB._id.toString());

    if (!subOrderA || !subOrderB) {
      throw new Error('Could not find store-specific sub-orders!');
    }

    // Verify sub-order items and vendorEarnings
    console.log('Verifying Sub-Order A details...');
    console.log(`- Sub-Order A totalPrice: $${subOrderA.totalPrice} (Expected: $20)`);
    console.log(`- Sub-Order A vendorEarnings: $${subOrderA.vendorEarnings} (Expected: $18.00 after 10% fee)`);
    if (subOrderA.totalPrice !== 20 || subOrderA.vendorEarnings !== 18.00) {
      throw new Error('Sub-Order A calculations are incorrect!');
    }

    console.log('Verifying Sub-Order B details...');
    console.log(`- Sub-Order B totalPrice: $${subOrderB.totalPrice} (Expected: $25)`);
    console.log(`- Sub-Order B vendorEarnings: $${subOrderB.vendorEarnings} (Expected: $21.25 after 15% fee)`);
    if (subOrderB.totalPrice !== 25 || subOrderB.vendorEarnings !== 21.25) {
      throw new Error('Sub-Order B calculations are incorrect!');
    }

    // 7. Test Payment Propagation
    console.log('Simulating parent order payment...');
    savedParentOrder.isPaid = true;
    savedParentOrder.paidAt = Date.now();
    savedParentOrder.status = 'paid';
    await savedParentOrder.save();

    // Wait a moment for post-save hooks to complete propagation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Re-query suborders
    const updatedSubOrderA = await Order.findById(subOrderA._id);
    const updatedSubOrderB = await Order.findById(subOrderB._id);

    console.log(`- Sub-Order A isPaid: ${updatedSubOrderA.isPaid} (Expected: true)`);
    console.log(`- Sub-Order B isPaid: ${updatedSubOrderB.isPaid} (Expected: true)`);

    if (!updatedSubOrderA.isPaid || !updatedSubOrderB.isPaid) {
      throw new Error('Payment status did not propagate to sub-orders!');
    }

    // 8. Verify Wallet Transactions
    console.log('Verifying Vendor Wallet balances...');
    const walletTxA = await WalletTransaction.findOne({ user: vendorA._id, order: subOrderA._id });
    const walletTxB = await WalletTransaction.findOne({ user: vendorB._id, order: subOrderB._id });

    if (!walletTxA || walletTxA.amount !== 18.00) {
      throw new Error(`Vendor A wallet transaction invalid or missing! Found amount: ${walletTxA?.amount}`);
    }
    if (!walletTxB || walletTxB.amount !== 21.25) {
      throw new Error(`Vendor B wallet transaction invalid or missing! Found amount: ${walletTxB?.amount}`);
    }

    console.log('Vendor Wallet Transactions validated:');
    console.log(`- Vendor A Wallet Credit: +$${walletTxA.amount}`);
    console.log(`- Vendor B Wallet Credit: +$${walletTxB.amount}`);

    // 9. Test Status Propagation
    console.log('Simulating parent order status update to "shipped"...');
    savedParentOrder.status = 'shipped';
    await savedParentOrder.save();

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    const shippedSubOrderA = await Order.findById(subOrderA._id);
    const shippedSubOrderB = await Order.findById(subOrderB._id);

    console.log(`- Sub-Order A status: "${shippedSubOrderA.status}" (Expected: "shipped")`);
    console.log(`- Sub-Order B status: "${shippedSubOrderB.status}" (Expected: "shipped")`);

    if (shippedSubOrderA.status !== 'shipped' || shippedSubOrderB.status !== 'shipped') {
      throw new Error('Status updates did not propagate to sub-orders!');
    }

    console.log('\n=======================================');
    console.log('🎉 MULTI-VENDOR ARCHITECTURE VERIFIED SUCCESSFULLY! 🎉');
    console.log('=======================================');

  } catch (error) {
    console.error('❌ Verification Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

runTest();
