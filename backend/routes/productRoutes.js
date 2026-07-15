import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, admin, vendor, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(optionalProtect, getProducts).post(protect, vendor, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, vendor, updateProduct)
  .delete(protect, vendor, deleteProduct);

export default router;
