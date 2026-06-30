import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';
import {
  ShippingZone,
  ShippingMethod,
  Warehouse,
  Supplier,
  StockTransfer,
  PurchaseOrder,
  StockHistory,
  Coupon,
  Review,
  AdminNotification,
  NotificationSettings,
} from '../models/OpsModels.js';

async function logStock(productId, change, balanceAfter, reason, note, userId, warehouseId, reference) {
  await StockHistory.create({
    product: productId,
    warehouse: warehouseId,
    change,
    balanceAfter,
    reason,
    note,
    user: userId,
    reference,
  });
}

export async function calculateShippingFee(req, res) {
  try {
    const { methodId, weightKg = 1, orderTotal = 0, zoneId } = req.body;
    let method;
    if (methodId) {
      method = await ShippingMethod.findById(methodId).populate('zone');
    } else if (zoneId) {
      method = await ShippingMethod.findOne({ zone: zoneId, isActive: true });
    }
    if (!method) return res.status(404).json({ message: 'No shipping method found' });

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
      estimateDays: `${method.minDays}-${method.maxDays} days`,
      warehouse: method.warehouse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getDeliveryEstimates(req, res) {
  try {
    const methods = await ShippingMethod.find({ isActive: true })
      .populate('zone', 'name countries')
      .populate('warehouse', 'name code city')
      .sort({ name: 1 });
    res.json(
      methods.map((m) => ({
        _id: m._id,
        name: m.name,
        zone: m.zone,
        warehouse: m.warehouse,
        minDays: m.minDays,
        maxDays: m.maxDays,
        baseFee: m.baseFee,
      }))
    );
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function getLowStockAlerts(req, res) {
  try {
    const settings = (await NotificationSettings.findOne()) || { lowStockThreshold: 5 };
    const threshold = settings.lowStockThreshold ?? 5;
    const products = await Product.find({ countInStock: { $lte: threshold } })
      .select('name image countInStock price category')
      .sort({ countInStock: 1 })
      .limit(100);
    res.json({ threshold, products });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function receivePurchaseOrder(req, res) {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('items.product');
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (po.status === 'received') return res.status(400).json({ message: 'Already received' });

    for (const item of po.items) {
      if (!item.product) continue;
      const product = await Product.findById(item.product._id || item.product);
      if (!product) continue;
      product.countInStock += item.quantity;
      await product.save();
      await logStock(
        product._id,
        item.quantity,
        product.countInStock,
        'purchase',
        `PO ${po.poNumber}`,
        req.user?._id,
        po.warehouse,
        po.poNumber
      );
    }

    po.status = 'received';
    po.receivedAt = new Date();
    await po.save();
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function completeStockTransfer(req, res) {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status === 'completed') return res.status(400).json({ message: 'Already completed' });

    transfer.status = 'completed';
    await transfer.save();
    await logStock(
      transfer.product,
      0,
      (await Product.findById(transfer.product))?.countInStock ?? 0,
      'transfer',
      `Transfer to warehouse ${transfer.toWarehouse}`,
      req.user?._id,
      transfer.toWarehouse,
      transfer._id.toString()
    );
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateReviewStatus(req, res) {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    ).populate('product', 'name').populate('user', 'name email');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getWishlistAdmin(req, res) {
  try {
    const items = await Wishlist.find({})
      .populate('user', 'name email')
      .populate('product', 'name price image category')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(items);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function getPopularWishlist(req, res) {
  try {
    const popular = await Wishlist.aggregate([
      { $group: { _id: '$product', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          count: 1,
          product: { _id: 1, name: 1, price: 1, image: 1, category: 1 },
        },
      },
    ]);
    res.json(popular);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function getNotifications(req, res) {
  try {
    const items = await AdminNotification.find({}).sort({ createdAt: -1 }).limit(100);
    const unread = await AdminNotification.countDocuments({ isRead: false });
    res.json({ items, unread });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    if (req.params.id === 'all') {
      await AdminNotification.updateMany({}, { isRead: true });
      return res.json({ message: 'All marked read' });
    }
    const n = await AdminNotification.findByIdAndUpdate(req.params.id, { isRead: true }, { returnDocument: 'after' });
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json(n);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function getNotificationSettings(req, res) {
  try {
    let settings = await NotificationSettings.findOne();
    if (!settings) settings = await NotificationSettings.create({});
    res.json(settings);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
}

export async function updateNotificationSettings(req, res) {
  try {
    let settings = await NotificationSettings.findOne();
    if (!settings) settings = await NotificationSettings.create(req.body);
    else Object.assign(settings, req.body), await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getReports(req, res) {
  try {
    const { type = 'sales', from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const orderMatch = Object.keys(dateFilter).length ? { createdAt: dateFilter, isPaid: true } : { isPaid: true };

    if (type === 'sales' || type === 'revenue') {
      const orders = await Order.find(orderMatch).select('totalPrice itemsPrice taxPrice shippingPrice createdAt');
      const revenue = orders.reduce((s, o) => s + o.totalPrice, 0);
      const tax = orders.reduce((s, o) => s + (o.taxPrice || 0), 0);
      const shipping = orders.reduce((s, o) => s + (o.shippingPrice || 0), 0);
      return res.json({ type, count: orders.length, revenue, tax, shipping, orders: orders.length });
    }

    if (type === 'products') {
      const top = await Order.aggregate([
        { $match: orderMatch },
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.name',
            qty: { $sum: '$orderItems.qty' },
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 20 },
      ]);
      return res.json({ type, top });
    }

    if (type === 'customers') {
      const customers = await User.countDocuments({ role: 'customer' });
      const newCustomers = await User.countDocuments({
        role: 'customer',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      });
      const top = await Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: '$user', total: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      ]);
      return res.json({ type, customers, newCustomers, top });
    }

    if (type === 'inventory') {
      const totalProducts = await Product.countDocuments();
      const outOfStock = await Product.countDocuments({ countInStock: 0 });
      const lowStock = await Product.countDocuments({ countInStock: { $lte: 5, $gt: 0 } });
      const totalUnits = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$countInStock' } } }]);
      return res.json({ type, totalProducts, outOfStock, lowStock, totalUnits: totalUnits[0]?.total ?? 0 });
    }

    if (type === 'coupons') {
      const coupons = await Coupon.find({}).select('code name type value usedCount usageLimit isActive expiresAt');
      const active = coupons.filter((c) => c.isActive).length;
      const totalUsed = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
      return res.json({ type, active, total: coupons.length, totalUsed, coupons });
    }

    if (type === 'tax') {
      const orders = await Order.find(orderMatch).select('taxPrice totalPrice createdAt');
      const totalTax = orders.reduce((s, o) => s + (o.taxPrice || 0), 0);
      return res.json({ type, totalTax, orderCount: orders.length });
    }

    res.status(400).json({ message: 'Unknown report type' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function seedAdminNotification(type, title, message, link, meta) {
  return AdminNotification.create({ type, title, message, link, meta });
}
