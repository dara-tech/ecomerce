import Order from '../models/Order.js';
import { validateOrderStock, fulfillOrderStock } from '../utils/orderFulfillment.js';
import { seedAdminNotification } from './opsController.js';
import { incrementCouponUsage } from './storeController.js';

// @desc    Create new order (auth or guest)
// @route   POST /api/orders
// @access  Private / Guest
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    guestEmail,
    guestName,
    couponCode,
    discountAmount,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  if (!req.user && !guestEmail) {
    res.status(401).json({ message: 'Please sign in or provide a guest email' });
    return;
  }

  const stockCheck = await validateOrderStock(orderItems);
  if (!stockCheck.ok) {
    res.status(400).json({ message: stockCheck.message });
    return;
  }

  // Find products to get their stores
  const { Product } = await import('../models/Product.js');
  const { Store } = await import('../models/Store.js');
  
  const populatedItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findById(item.product || item._id).populate('store');
      return {
        ...item,
        product: product._id,
        store: product.store ? product.store._id : null,
        commissionRate: product.store ? product.store.commissionRate : 10.0
      };
    })
  );

  // Group by store
  const itemsByStore = {};
  for (const item of populatedItems) {
    const storeId = item.store ? item.store.toString() : 'platform';
    if (!itemsByStore[storeId]) itemsByStore[storeId] = [];
    itemsByStore[storeId].push(item);
  }

  // Create Parent Order
  const parentOrder = new Order({
    orderItems: populatedItems,
    user: req.user?._id,
    isGuest: !req.user,
    guestEmail: req.user ? undefined : guestEmail,
    guestName: req.user ? undefined : guestName,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    couponCode: couponCode || undefined,
    discountAmount: discountAmount || 0,
  });

  const createdOrder = await parentOrder.save();

  // Create Child Orders for Vendors
  const childOrderPromises = Object.entries(itemsByStore).map(async ([storeId, items]) => {
    if (storeId === 'platform') return; // no store associated

    const childItemsPrice = items.reduce((acc, item) => acc + item.price * item.qty, 0);
    // simplistic tax/shipping split (could be improved)
    const childTaxPrice = (childItemsPrice / itemsPrice) * taxPrice;
    const childShippingPrice = (childItemsPrice / itemsPrice) * shippingPrice;
    const childTotalPrice = childItemsPrice + childTaxPrice + childShippingPrice;
    const commissionRate = items[0].commissionRate || 10.0;
    const vendorEarnings = childTotalPrice * ((100 - commissionRate) / 100);

    const childOrder = new Order({
      parentOrder: createdOrder._id,
      store: storeId,
      orderItems: items,
      user: req.user?._id,
      isGuest: !req.user,
      shippingAddress,
      paymentMethod,
      itemsPrice: childItemsPrice,
      taxPrice: childTaxPrice,
      shippingPrice: childShippingPrice,
      totalPrice: childTotalPrice,
      vendorEarnings,
    });
    return childOrder.save();
  });

  await Promise.all(childOrderPromises);

  if (couponCode) {
    await incrementCouponUsage(couponCode);
  }

  seedAdminNotification(
    'new_order',
    'New order received',
    `Order #${createdOrder._id.toString().slice(-8)} — $${createdOrder.totalPrice.toFixed(2)}`,
    '/orders',
    { orderId: createdOrder._id }
  ).catch(() => {});

  if (paymentMethod === 'Cash on Delivery' || paymentMethod === 'cod') {
    const stockResult = await fulfillOrderStock(createdOrder);
    if (!stockResult.ok) {
      await createdOrder.deleteOne();
      res.status(400).json({ message: stockResult.message });
      return;
    }
  }

  res.status(201).json(createdOrder);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer?.email_address,
    };

    const stockResult = await fulfillOrderStock(order);
    if (!stockResult.ok && !order.stockDeducted) {
      res.status(400).json({ message: stockResult.message });
      return;
    }

    const updatedOrder = await order.save();

    // Mark child orders as paid and update vendor balance
    const childOrders = await Order.find({ parentOrder: order._id });
    if (childOrders.length > 0) {
      const { Store } = await import('../models/Store.js');
      await Promise.all(
        childOrders.map(async (childOrder) => {
          childOrder.isPaid = true;
          childOrder.paidAt = Date.now();
          childOrder.paymentResult = order.paymentResult;
          await childOrder.save();

          if (childOrder.store && childOrder.vendorEarnings > 0) {
            await Store.findByIdAndUpdate(childOrder.store, {
              $inc: { balance: childOrder.vendorEarnings, totalEarned: childOrder.vendorEarnings },
            });
          }
        })
      );
    } else if (order.store && order.vendorEarnings > 0) {
      // In case they pay a child order directly
      const { Store } = await import('../models/Store.js');
      await Store.findByIdAndUpdate(order.store, {
        $inc: { balance: order.vendorEarnings, totalEarned: order.vendorEarnings },
      });
    }

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (req.body.status) {
      order.status = req.body.status;
      order.timeline.push({
        status: req.body.status,
        note: req.body.timelineNote || ''
      });
    }
    
    if (req.body.trackingNumber !== undefined) {
      order.trackingNumber = req.body.trackingNumber;
    }
    if (req.body.customerNotes !== undefined) {
      order.customerNotes = req.body.customerNotes;
    }
    if (req.body.adminNotes !== undefined) {
      order.adminNotes = req.body.adminNotes;
    }
    if (req.body.invoiceUrl !== undefined) {
      order.invoiceUrl = req.body.invoiceUrl;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  const parentOrders = await Order.find({ user: req.user._id, parentOrder: { $exists: false } }).sort({ createdAt: -1 }).lean();
  
  const parentIds = parentOrders.map(o => o._id);
  const subOrders = await Order.find({ parentOrder: { $in: parentIds } }).populate('store', 'name logo').lean();

  const ordersWithSub = parentOrders.map(parent => ({
    ...parent,
    subOrders: subOrders.filter(sub => sub.parentOrder.toString() === parent._id.toString())
  }));
  
  res.json(ordersWithSub);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  const isVendor = req.user && req.user.role === 'vendor';
  let query = {};
  if (isVendor) {
    const { Store } = await import('../models/Store.js');
    const store = await Store.findOne({ vendor: req.user._id });
    query = { store: store ? store._id : null };
  } else {
    // Optional: filter out sub-orders for admin if preferred, but usually admin wants to see all.
  }
  
  const orders = await Order.find(query).populate('user', 'id name').sort({ createdAt: -1 });
  res.json(orders);
};
