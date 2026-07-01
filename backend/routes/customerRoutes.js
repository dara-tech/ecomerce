import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getWallet,
  topUpWallet,
  redeemLoyaltyPoints,
  getRecommendations,
  getCartRecommendations,
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recommendations/cart', getCartRecommendations);
router.get('/recommendations', (req, res) => {
  req.params.productId = 'home';
  return getRecommendations(req, res);
});
router.get('/recommendations/:productId', getRecommendations);

router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

router.get('/wallet', protect, getWallet);
router.post('/wallet/topup', protect, topUpWallet);
router.post('/wallet/redeem-points', protect, redeemLoyaltyPoints);

export default router;
