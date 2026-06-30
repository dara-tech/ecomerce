import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  EmailCampaign,
  PushNotification,
  Popup,
  FlashSale,
} from '../models/MarketingModels.js';

const router = express.Router();

function crudRoutes(Model, label) {
  router.get(`/${label}`, protect, admin, async (req, res) => {
    try {
      let query = Model.find({}).sort({ createdAt: -1 });
      if (label === 'flash-sales') {
        query = query.populate('products', 'name price image');
      }
      const items = await query;
      res.json(items);
    } catch {
      res.status(500).json({ message: 'Server Error' });
    }
  });

  router.post(`/${label}`, protect, admin, async (req, res) => {
    try {
      const item = new Model(req.body);
      const created = await item.save();
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: error.message || 'Invalid data' });
    }
  });

  router.put(`/${label}/:id`, protect, admin, async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: 'after',
      });
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: error.message || 'Invalid data' });
    }
  });

  router.delete(`/${label}/:id`, protect, admin, async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Removed' });
    } catch {
      res.status(500).json({ message: 'Server Error' });
    }
  });
}

crudRoutes(EmailCampaign, 'email-campaigns');
crudRoutes(PushNotification, 'push-notifications');
crudRoutes(Popup, 'popups');
crudRoutes(FlashSale, 'flash-sales');

router.post('/email-campaigns/:id/send', protect, admin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = (campaign.stats?.sent || 0) + 1;
    await campaign.save();
    res.json(campaign);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/push-notifications/:id/send', protect, admin, async (req, res) => {
  try {
    const notification = await PushNotification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();
    res.json(notification);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Public: active popups for storefront
router.get('/popups/active', async (req, res) => {
  try {
    const now = new Date();
    const popups = await Popup.find({
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    }).sort({ sortOrder: 1 });
    res.json(popups);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Public: active flash sales
router.get('/flash-sales/active', async (req, res) => {
  try {
    const now = new Date();
    const sales = await FlashSale.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('products', 'name price image')
      .sort({ startDate: 1 });
    res.json(sales);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
