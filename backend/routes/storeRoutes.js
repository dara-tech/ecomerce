import express from 'express';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import {
  validateCouponCode,
  validateCartItems,
  getPublicShippingMethods,
  calculatePublicShipping,
  submitProductReview,
  getProductReviews,
  requestReturn,
  getMyReturns,
  payWithWallet,
  getPublicStoreById,
  getPublicStores,
} from '../controllers/storeController.js';

const router = express.Router();

router.post('/coupons/validate', validateCouponCode);
router.post('/cart/validate', validateCartItems);
router.get('/shipping/methods', getPublicShippingMethods);
router.post('/shipping/calculate', calculatePublicShipping);
router.get('/products/:productId/reviews', getProductReviews);
router.post('/reviews', protect, submitProductReview);
router.post('/returns', optionalProtect, requestReturn);
router.get('/returns/mine', protect, getMyReturns);
router.post('/wallet/pay/:orderId', protect, payWithWallet);
router.get('/public', getPublicStores);
router.get('/public/:id', getPublicStoreById);

export default router;
