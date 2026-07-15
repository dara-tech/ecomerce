import PayoutRequest from '../models/PayoutRequest.js';
import { Store } from '../models/Store.js';
import { seedAdminNotification } from './opsController.js';
import { logActivity } from '../services/activityService.js';

// @desc    Get logged in vendor's payouts
// @route   GET /api/payouts/my-payouts
// @access  Private/Vendor
export const getMyPayouts = async (req, res) => {
  const store = await Store.findOne({ vendor: req.user._id });
  if (!store) {
    res.status(404).json({ message: 'Store not found' });
    return;
  }

  const payouts = await PayoutRequest.find({ store: store._id }).sort({ createdAt: -1 });
  res.json({ payouts, balance: store.balance, totalEarned: store.totalEarned });
};

// @desc    Request a payout
// @route   POST /api/payouts
// @access  Private/Vendor
export const requestPayout = async (req, res) => {
  const { amount, method, paymentDetails } = req.body;

  if (amount <= 0) {
    res.status(400).json({ message: 'Invalid payout amount' });
    return;
  }

  const store = await Store.findOne({ vendor: req.user._id });
  if (!store) {
    res.status(404).json({ message: 'Store not found' });
    return;
  }

  if (store.balance < amount) {
    res.status(400).json({ message: 'Insufficient balance' });
    return;
  }

  // Deduct from balance
  store.balance -= amount;
  await store.save();

  const payout = new PayoutRequest({
    store: store._id,
    vendor: req.user._id,
    amount,
    method,
    paymentDetails,
  });

  const createdPayout = await payout.save();

  seedAdminNotification(
    'payout_requested',
    'Payout Requested',
    `${store.name} requested a payout of $${amount.toFixed(2)}`,
    '/payouts',
    { payoutId: createdPayout._id }
  ).catch(() => {});

  await logActivity({ req, action: 'payout.requested', details: { amount, method } });

  res.status(201).json(createdPayout);
};

// @desc    Get all payouts
// @route   GET /api/payouts
// @access  Private/Admin
export const getPayouts = async (req, res) => {
  const payouts = await PayoutRequest.find({})
    .populate('store', 'name')
    .populate('vendor', 'name email')
    .sort({ createdAt: -1 });
  res.json(payouts);
};

// @desc    Update payout status
// @route   PUT /api/payouts/:id/status
// @access  Private/Admin
export const updatePayoutStatus = async (req, res) => {
  const { status, transactionId, adminNotes } = req.body;

  const payout = await PayoutRequest.findById(req.params.id).populate('store');

  if (payout) {
    // If rejecting, refund the balance to the store
    if (status === 'rejected' && payout.status !== 'rejected') {
      const store = await Store.findById(payout.store._id);
      if (store) {
        store.balance += payout.amount;
        await store.save();
      }
    }
    // If was rejected and now pending/paid, deduct balance again
    else if (payout.status === 'rejected' && status !== 'rejected') {
      const store = await Store.findById(payout.store._id);
      if (store) {
        store.balance -= payout.amount;
        await store.save();
      }
    }

    payout.status = status || payout.status;
    payout.transactionId = transactionId || payout.transactionId;
    payout.adminNotes = adminNotes || payout.adminNotes;
    
    if (status === 'paid' && !payout.paidAt) {
      payout.paidAt = Date.now();
    }

    const updatedPayout = await payout.save();
    res.json(updatedPayout);
  } else {
    res.status(404).json({ message: 'Payout request not found' });
  }
};
