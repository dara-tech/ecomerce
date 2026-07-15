import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { Store } from '../models/Store.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// Vendor: Register a new vendor and their store
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, storeName, storeDescription } = req.body;

    if (!name || !email || !password || !storeName) {
      return res.status(400).json({ message: 'All fields including store name are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user with vendor role
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'vendor',
      status: 'active',
    });

    // Create associated Store
    const store = await Store.create({
      vendor: user._id,
      name: storeName,
      description: storeDescription || '',
      status: 'active', // Set to active directly for convenience, or pending for admin approval
    });

    res.status(201).json({
      message: 'Vendor and Store registered successfully',
      vendor: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
      store,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vendor: Create a store for an existing logged-in user (elevates role to vendor)
router.post('/create-store', protect, async (req, res) => {
  try {
    const { storeName, storeDescription } = req.body;

    if (!storeName) {
      return res.status(400).json({ message: 'Store name is required' });
    }

    const storeExists = await Store.findOne({ vendor: req.user._id });
    if (storeExists) {
      return res.status(400).json({ message: 'Store already exists for this user' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
      req.user.role = 'vendor';
      await req.user.save();
    }

    const store = await Store.create({
      vendor: req.user._id,
      name: storeName,
      description: storeDescription || '',
      status: 'active',
    });

    res.status(201).json({
      message: 'Store created successfully',
      vendor: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        token: generateToken(req.user._id),
      },
      store,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vendor: Get own store details
router.get('/my-store', protect, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Vendor role required' });
    }

    const store = await Store.findOne({ vendor: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found for this user' });
    }

    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vendor: Update own store details
router.put('/my-store', protect, async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Vendor role required' });
    }

    const store = await Store.findOne({ vendor: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { name, logo, description } = req.body;
    if (name) store.name = name;
    if (logo !== undefined) store.logo = logo;
    if (description !== undefined) store.description = description;

    await store.save();
    res.json({ message: 'Store updated successfully', store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all stores
router.get('/admin/stores', protect, admin, async (req, res) => {
  try {
    const stores = await Store.find({}).populate('vendor', 'name email');
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update store status (approve / suspend)
router.put('/admin/stores/:id/status', protect, admin, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { status } = req.body;
    if (!['pending', 'active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid store status' });
    }

    store.status = status;
    await store.save();

    res.json({ message: `Store status updated to ${status}`, store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update store commission rate
router.put('/admin/stores/:id/commission', protect, admin, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { commissionRate } = req.body;
    if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ message: 'Commission rate must be a number between 0 and 100' });
    }

    store.commissionRate = commissionRate;
    await store.save();

    res.json({ message: `Store commission rate updated to ${commissionRate}%`, store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update store profile (name, logo, description)
router.put('/admin/stores/:id', protect, admin, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const { name, logo, description } = req.body;
    if (name) store.name = name;
    if (logo !== undefined) store.logo = logo;
    if (description !== undefined) store.description = description;

    await store.save();
    res.json({ message: 'Store updated successfully', store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
