import express from 'express';
import {
  getMyPayouts,
  requestPayout,
  getPayouts,
  updatePayoutStatus,
} from '../controllers/payoutController.js';
import { protect, admin, vendor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, vendor, requestPayout)
  .get(protect, admin, getPayouts);

router.route('/my-payouts').get(protect, vendor, getMyPayouts);
router.route('/:id/status').put(protect, admin, updatePayoutStatus);

export default router;
