import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
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
} from '../models/OpsModels.js';
import {
  calculateShippingFee,
  getDeliveryEstimates,
  getLowStockAlerts,
  receivePurchaseOrder,
  completeStockTransfer,
  updateReviewStatus,
  getWishlistAdmin,
  getPopularWishlist,
  getNotifications,
  markNotificationRead,
  getNotificationSettings,
  updateNotificationSettings,
  getReports,
} from '../controllers/opsController.js';

const router = express.Router();

function mountCrud(path, Model, options = {}) {
  router.get(`/${path}`, protect, admin, async (req, res) => {
    try {
      let q = Model.find({}).sort({ createdAt: -1 });
      if (options.populate) q = q.populate(options.populate);
      res.json(await q);
    } catch {
      res.status(500).json({ message: 'Server Error' });
    }
  });

  router.post(`/${path}`, protect, admin, async (req, res) => {
    try {
      const item = await Model.create(req.body);
      if (options.populate) await item.populate(options.populate);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: error.message || 'Invalid data' });
    }
  });

  router.put(`/${path}/:id`, protect, admin, async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
      if (!item) return res.status(404).json({ message: 'Not found' });
      if (options.populate) await item.populate(options.populate);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: error.message || 'Invalid data' });
    }
  });

  router.delete(`/${path}/:id`, protect, admin, async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Removed' });
    } catch {
      res.status(500).json({ message: 'Server Error' });
    }
  });
}

// Shipping
mountCrud('shipping/zones', ShippingZone);
mountCrud('shipping/methods', ShippingMethod, { populate: 'zone warehouse' });
router.post('/shipping/calculate', protect, admin, calculateShippingFee);
router.get('/shipping/estimates', protect, admin, getDeliveryEstimates);

// Inventory
mountCrud('inventory/warehouses', Warehouse);
mountCrud('inventory/suppliers', Supplier);
mountCrud('inventory/transfers', StockTransfer, { populate: 'fromWarehouse toWarehouse product' });
mountCrud('inventory/purchase-orders', PurchaseOrder, { populate: 'supplier warehouse items.product' });
router.post('/inventory/purchase-orders/:id/receive', protect, admin, receivePurchaseOrder);
router.post('/inventory/transfers/:id/complete', protect, admin, completeStockTransfer);
router.get('/inventory/stock-history', protect, admin, async (req, res) => {
  try {
    const items = await StockHistory.find({})
      .populate('product', 'name image')
      .populate('warehouse', 'name code')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(items);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});
router.get('/inventory/low-stock', protect, admin, getLowStockAlerts);

// Coupons
mountCrud('coupons', Coupon, { populate: 'customer' });

// Reviews
router.get('/reviews', protect, admin, async (req, res) => {
  try {
    const items = await Review.find({})
      .populate('product', 'name image')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});
router.post('/reviews', protect, admin, async (req, res) => {
  try {
    const spamScore = detectSpam(req.body.comment || '');
    const item = await Review.create({ ...req.body, spamScore, status: spamScore > 0.7 ? 'spam' : 'pending' });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.put('/reviews/:id/status', protect, admin, updateReviewStatus);
router.delete('/reviews/:id', protect, admin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed' });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

function detectSpam(text) {
  const lower = text.toLowerCase();
  let score = 0;
  if (lower.includes('http://') || lower.includes('https://')) score += 0.4;
  if ((lower.match(/!/g) || []).length > 3) score += 0.2;
  if (lower.length < 10) score += 0.2;
  if (/(.)\1{4,}/.test(lower)) score += 0.3;
  return Math.min(1, score);
}

// Wishlist admin
router.get('/wishlists', protect, admin, getWishlistAdmin);
router.get('/wishlists/popular', protect, admin, getPopularWishlist);

// Notifications
router.get('/notifications', protect, admin, getNotifications);
router.put('/notifications/:id/read', protect, admin, markNotificationRead);
router.get('/notifications/settings', protect, admin, getNotificationSettings);
router.put('/notifications/settings', protect, admin, updateNotificationSettings);

// Reports
router.get('/reports', protect, admin, getReports);

export default router;
