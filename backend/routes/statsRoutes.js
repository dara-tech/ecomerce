import express from 'express';
const router = express.Router();
import { getDashboardStats } from '../controllers/statsController.js';
import { protect, vendor } from '../middleware/authMiddleware.js';

router.route('/').get(protect, vendor, getDashboardStats);

export default router;
