import Order from '../models/Order.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import RefundRequest from '../models/RefundRequest.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { Coupon, Review, ShippingMethod } from '../models/OpsModels.js';
import { seedAdminNotification } from './opsController.js';

function detectSpam(text) {
  const lower = (text || '').toLowerCase();
  let score = 0;
  if (lower.includes('http://') || lower.includes('https://')) score += 0.4;
  if ((lower.match(/!/g) || []).length > 3) score += 0.2;
  if (lower.length < 10) score += 0.2;
  if (/(.)\1{4,}/.test(lower)) score += 0.3;
  return Math.min(1, score);
}

export async function validateCouponCode(req, res) {
  try {
    const { code, orderTotal = 0 } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code required' });

    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim(), isActive: true });
    if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid coupon code' });

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
    }
    if (orderTotal < (coupon.minOrderAmount || 0)) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount is $${coupon.minOrderAmount.toFixed(2)}`,
      });
    }

    let discount = 0;
    let freeShipping = false;
    if (coupon.type === 'percent') {
      discount = (orderTotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, orderTotal);
    } else if (coupon.type === 'free_shipping') {
      freeShipping = true;
    }

    res.json({
      valid: true,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      discount: Math.round(discount * 100) / 100,
      freeShipping,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function validateCartItems(req, res) {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ valid: true, items: [], removed: [] });
    }

    const synced = [];
    const removed = [];

    for (const item of items) {
      const productId = item._id || item.product;
      const label = item.name || 'Item';

      if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
        removed.push({ _id: productId, name: label, reason: 'invalid' });
        continue;
      }

      const product = await Product.findById(productId);
      if (!product) {
        removed.push({ _id: productId, name: label, reason: 'not_found' });
        continue;
      }

      if (product.countInStock <= 0) {
        removed.push({ _id: productId, name: product.name, reason: 'out_of_stock' });
        continue;
      }

      const qty = Math.min(Math.max(1, Number(item.qty) || 1), product.countInStock);
      synced.push({
        _id: String(product._id),
        name: product.name,
        image: product.image,
        price: product.price,
        qty,
        countInStock: product.countInStock,
      });
    }

    res.json({
      valid: removed.length === 0,
      items: synced,
      removed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getPublicShippingMethods(req, res) {
  try {
    const methods = await ShippingMethod.find({ isActive: true })
      .populate('zone', 'name countries')
      .sort({ name: 1 });
    res.json(methods);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function calculatePublicShipping(req, res) {
  try {
    const { methodId, weightKg = 1, orderTotal = 0 } = req.body;
    const method = await ShippingMethod.findById(methodId).populate('zone');
    if (!method || !method.isActive) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }

    let fee = 0;
    if (method.type === 'free' || (method.freeAbove > 0 && orderTotal >= method.freeAbove)) {
      fee = 0;
    } else if (method.type === 'weight') {
      fee = method.baseFee + method.perKgFee * Math.max(1, weightKg);
    } else {
      fee = method.baseFee;
    }

    res.json({
      fee,
      method: method.name,
      methodId: method._id,
      estimateDays: `${method.minDays}-${method.maxDays} days`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function submitProductReview(req, res) {
  try {
    const { productId, rating, comment, name } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Product, rating, and comment are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this product' });

    const spamScore = detectSpam(comment);
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: name || req.user.name,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment,
      spamScore,
      status: spamScore > 0.7 ? 'spam' : 'pending',
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getProductReviews(req, res) {
  try {
    const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(reviews);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function requestReturn(req, res) {
  try {
    const { orderId, reason, amount } = req.body;
    if (!orderId || !reason) {
      return res.status(400).json({ message: 'Order and reason are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner =
      (req.user && String(order.user) === String(req.user._id)) ||
      (order.isGuest && order.guestEmail && order.guestEmail === req.body.guestEmail);

    if (!isOwner) return res.status(403).json({ message: 'Not authorized for this order' });

    const existing = await RefundRequest.findOne({ order: orderId, status: { $in: ['pending', 'approved'] } });
    if (existing) return res.status(400).json({ message: 'Return request already submitted' });

    const refund = await RefundRequest.create({
      order: orderId,
      user: req.user?._id || order.user,
      amount: amount ?? order.totalPrice,
      reason,
      status: 'pending',
    });

    order.status = 'returned';
    order.timeline = order.timeline || [];
    order.timeline.push({ status: 'return_requested', note: reason });
    await order.save();

    seedAdminNotification(
      'refund_request',
      'Return / refund request',
      `Order #${orderId.slice(-8)} — ${reason.slice(0, 80)}`,
      '/returns',
      { orderId, refundId: refund._id }
    ).catch(() => {});

    res.status(201).json(refund);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getMyReturns(req, res) {
  try {
    const refunds = await RefundRequest.find({ user: req.user._id })
      .populate('order', 'totalPrice status createdAt')
      .sort({ createdAt: -1 });
    res.json(refunds);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function payWithWallet(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.isPaid) return res.status(400).json({ message: 'Order already paid' });

    const user = await User.findById(req.user._id);
    if (user.walletBalance < order.totalPrice) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance -= order.totalPrice;
    await user.save();

    await WalletTransaction.create({
      user: user._id,
      type: 'debit',
      amount: order.totalPrice,
      description: `Order #${order._id.toString().slice(-8)}`,
      reference: order._id.toString(),
    });

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = order.status === 'pending' ? 'paid' : order.status;
    order.paymentMethod = 'Wallet';
    await order.save();

    res.json({ message: 'Payment successful', order, balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function incrementCouponUsage(code) {
  if (!code) return;
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}
