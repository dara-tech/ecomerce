import Product from '../models/Product.js';
import { Store } from '../models/Store.js';
import Order from '../models/Order.js';
import WalletTransaction from '../models/WalletTransaction.js';

/**
 * Splits a master parent order into store-specific vendor sub-orders
 * @param {object} parentOrder - The saved Mongoose Order document
 */
export async function splitOrderIntoVendorSubOrders(parentOrder) {
  try {
    const itemProductIds = parentOrder.orderItems.map(item => item.product);

    // Look up stores for the products
    const products = await Product.find({ _id: { $in: itemProductIds } });
    const productToStoreMap = {};
    products.forEach(p => {
      productToStoreMap[p._id.toString()] = p.store ? p.store.toString() : 'platform';
    });

    // Group items by store
    const storeGroups = {};
    parentOrder.orderItems.forEach(item => {
      const storeId = productToStoreMap[item.product.toString()] || 'platform';
      if (!storeGroups[storeId]) {
        storeGroups[storeId] = [];
      }
      storeGroups[storeId].push(item);
    });

    // For each store group, create a sub-order
    for (const [storeId, items] of Object.entries(storeGroups)) {
      // Calculate subtotal
      const itemsPrice = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      let commissionRate = 10.0; // Default platform commission
      let storeRef = null;

      if (storeId !== 'platform') {
        const store = await Store.findById(storeId);
        if (store) {
          commissionRate = store.commissionRate;
          storeRef = store._id;
        }
      }

      // Calculate vendor earnings after commission
      const vendorEarnings = Number((itemsPrice * (1 - commissionRate / 100)).toFixed(2));

      const subOrder = new Order({
        user: parentOrder.user,
        isGuest: parentOrder.isGuest,
        guestEmail: parentOrder.guestEmail,
        guestName: parentOrder.guestName,
        shippingAddress: parentOrder.shippingAddress,
        paymentMethod: parentOrder.paymentMethod,
        isPaid: parentOrder.isPaid,
        paidAt: parentOrder.paidAt,
        status: parentOrder.status,
        couponCode: parentOrder.couponCode,
        
        parentOrder: parentOrder._id,
        store: storeRef,
        orderItems: items,
        itemsPrice,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: itemsPrice,
        vendorEarnings,
      });

      await subOrder.save();

      // If parent order is already paid (e.g. via gateway / wallet upfront), credit vendor wallet immediately
      if (subOrder.isPaid && storeRef) {
        const store = await Store.findById(storeRef);
        if (store) {
          await creditVendorWallet(store.vendor, vendorEarnings, subOrder._id);
        }
      }
    }
  } catch (error) {
    console.error('Error splitting order:', error);
  }
}

/**
 * Propagates payment updates from parent order to sub-orders
 * @param {object} parentOrder - The saved master Order document
 */
export async function propagateOrderPayment(parentOrder) {
  try {
    const subOrders = await Order.find({ parentOrder: parentOrder._id });
    
    for (const subOrder of subOrders) {
      if (!subOrder.isPaid) {
        subOrder.isPaid = true;
        subOrder.paidAt = parentOrder.paidAt || Date.now();
        subOrder.status = 'paid';
        await subOrder.save();

        // Credit vendor wallet
        if (subOrder.store) {
          const store = await Store.findById(subOrder.store);
          if (store) {
            await creditVendorWallet(store.vendor, subOrder.vendorEarnings, subOrder._id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error propagating order payment:', error);
  }
}

/**
 * Propagates status updates from parent order to sub-orders
 * @param {object} parentOrder - The parent order document
 * @param {string} status - New order status
 */
export async function propagateOrderStatus(parentOrder, status) {
  try {
    await Order.updateMany(
      { parentOrder: parentOrder._id },
      { 
        $set: { status },
        $push: { timeline: { status, note: 'Status synced from parent order checkout.' } }
      }
    );
  } catch (error) {
    console.error('Error propagating order status:', error);
  }
}

/**
 * Helper to credit a vendor's wallet balance
 */
async function creditVendorWallet(vendorId, amount, subOrderId) {
  try {
    // Check if transaction already exists for this order to prevent double credit
    const exists = await WalletTransaction.findOne({ order: subOrderId, type: 'credit' });
    if (exists) return;

    await WalletTransaction.create({
      user: vendorId,
      type: 'credit',
      amount,
      description: `Earnings for multi-vendor order sub-order #${subOrderId.toString().slice(-8)}`,
      order: subOrderId,
    });
    
    // Also update the Store's balance and totalEarned
    await Store.findOneAndUpdate(
      { vendor: vendorId },
      { $inc: { balance: amount, totalEarned: amount } }
    );

    console.log(`Credited ${amount} to vendor ${vendorId} for sub-order ${subOrderId}`);
  } catch (error) {
    console.error('Failed to credit vendor wallet:', error);
  }
}
