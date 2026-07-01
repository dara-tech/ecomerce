import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { protect, admin } from '../middleware/authMiddleware.js';
import { importImageFromUrl, searchInternetImages } from '../controllers/imageSearchController.js';

dotenv.config();

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

// @desc    Upload product image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
// @desc    Search open-licensed images (Openverse)
// @route   GET /api/upload/images/search
// @access  Private/Admin
router.get('/images/search', protect, admin, searchInternetImages);

// @desc    Import remote image URL to Cloudinary
// @route   POST /api/upload/import-url
// @access  Private/Admin
router.post('/import-url', protect, admin, importImageFromUrl);

router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  // req.file.path contains the secure Cloudinary URL
  res.status(200).json({
    message: 'Image uploaded successfully',
    url: req.file.path,
  });
});

export default router;
