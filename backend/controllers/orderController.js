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

  const order = new Order({
    orderItems: orderItems.map((item) => ({
      ...item,
      product: item.product || item._id,
    })),
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

  const createdOrder = await order.save();

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
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
};
