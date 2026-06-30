import express from 'express';
const router = express.Router();
import { getDashboardStats } from '../controllers/statsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, admin, getDashboardStats);

export default router;
