import './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
import chatRoutes from './routes/chatRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import { initTelegramBot } from './services/telegramBotService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// Attach io to req so routes can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  socket.on('join_session', (sessionId) => {
    console.log(`Socket ${socket.id} joining session ${sessionId}`);
    socket.join(sessionId);
  });

  socket.on('join_admin', () => {
    console.log(`Socket ${socket.id} joining admin room`);
    socket.join('admin');
  });

  socket.on('typing', ({ sessionId, role }) => {
    console.log(`Typing event received for session ${sessionId} from ${role}`);
    socket.to(sessionId).emit('typing', { role });
  });

  socket.on('stop_typing', ({ sessionId, role }) => {
    console.log(`Stop typing event received for session ${sessionId} from ${role}`);
    socket.to(sessionId).emit('stop_typing', { role });
  });

  // WebRTC Signaling
  socket.on('webrtc_call_request', ({ sessionId, fromRole, withVideo }) => {
    socket.to(sessionId).emit('webrtc_call_request', { fromRole, withVideo });
  });

  socket.on('webrtc_call_accepted', ({ sessionId, fromRole }) => {
    socket.to(sessionId).emit('webrtc_call_accepted', { fromRole });
  });

  socket.on('webrtc_call_rejected', ({ sessionId, fromRole }) => {
    socket.to(sessionId).emit('webrtc_call_rejected', { fromRole });
  });

  socket.on('webrtc_call_ended', ({ sessionId, fromRole }) => {
    socket.to(sessionId).emit('webrtc_call_ended', { fromRole });
  });

  socket.on('webrtc_offer', ({ sessionId, fromRole, offer }) => {
    socket.to(sessionId).emit('webrtc_offer', { fromRole, offer });
  });

  socket.on('webrtc_answer', ({ sessionId, fromRole, answer }) => {
    socket.to(sessionId).emit('webrtc_answer', { fromRole, answer });
  });

  socket.on('webrtc_ice_candidate', ({ sessionId, fromRole, candidate }) => {
    socket.to(sessionId).emit('webrtc_ice_candidate', { fromRole, candidate });
  });
});

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
app.use('/api/chat', chatRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/payouts', payoutRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/e-commerce';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    initTelegramBot();
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});
