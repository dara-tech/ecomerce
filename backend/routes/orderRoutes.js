import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  deleteOrder,
} from '../controllers/orderController.js';
import { protect, admin, vendor, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(optionalProtect, addOrderItems).get(protect, vendor, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).delete(protect, vendor, deleteOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/status').put(protect, vendor, updateOrderStatus);

export default router;
