import express from 'express';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import {
  validateCouponCode,
  getPublicShippingMethods,
  calculatePublicShipping,
  submitProductReview,
  getProductReviews,
  requestReturn,
  getMyReturns,
  payWithWallet,
} from '../controllers/storeController.js';

const router = express.Router();

router.post('/coupons/validate', validateCouponCode);
router.get('/shipping/methods', getPublicShippingMethods);
router.post('/shipping/calculate', calculatePublicShipping);
router.get('/products/:productId/reviews', getProductReviews);
router.post('/reviews', protect, submitProductReview);
router.post('/returns', optionalProtect, requestReturn);
router.get('/returns/mine', protect, getMyReturns);
router.post('/wallet/pay/:orderId', protect, payWithWallet);

export default router;
