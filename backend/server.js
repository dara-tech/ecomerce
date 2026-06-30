import './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import opsRoutes from './routes/opsRoutes.js';

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/ops', opsRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/e-commerce';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});
