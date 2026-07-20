import express from 'express';
import { ChatSession } from '../models/Chat.js';
import { sendToTelegram } from '../services/telegramBotService.js';
import { optionalProtect, protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin: Get all chat sessions
router.get('/admin/sessions', protect, admin, async (req, res) => {
  try {
    const sessions = await ChatSession.find({})
      .sort({ updatedAt: -1 })
      .populate('user', 'name email avatar');
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete a chat session
router.delete('/admin/session/:sessionId', protect, admin, async (req, res) => {
  try {
    const result = await ChatSession.findOneAndDelete({ sessionId: req.params.sessionId });
    if (!result) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reply to a session
router.post('/admin/reply', protect, admin, async (req, res) => {
  try {
    const { sessionId, text } = req.body;
    if (!sessionId || !text) {
      return res.status(400).json({ message: 'Session ID and text are required' });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.messages.push({
      from: 'admin',
      text,
    });
    
    // Auto-update seen receipt
    session.lastSeenByAdmin = new Date();
    
    // We update the timestamp so it jumps to top
    await session.save();

    if (req.io) {
      req.io.to(sessionId).emit('receive_message', session.messages);
      req.io.to('admin').emit('update_sessions');
    }

    res.status(201).json({ success: true, messages: session.messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat history for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId })
      .populate('user', 'name avatar');
    if (!session) {
      return res.json({ messages: [], lastSeenByAdmin: null, lastSeenByUser: null, adminTypingUntil: null });
    }

    // Auto-update last seen to keep online status accurate
    session.lastSeenByUser = new Date();
    await session.save();

    res.json({
      messages: session.messages,
      user: session.user,
      lastSeenByAdmin: session.lastSeenByAdmin,
      lastSeenByUser: session.lastSeenByUser,
      adminTypingUntil: session.adminTypingUntil
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a new message
router.post('/send', optionalProtect, async (req, res) => {
  try {
    const { sessionId, text, guestName } = req.body;

    if (!sessionId || !text) {
      return res.status(400).json({ message: 'Session ID and text are required' });
    }

    let session = await ChatSession.findOne({ sessionId });
    
    // Create session if it doesn't exist
    if (!session) {
      session = new ChatSession({
        sessionId,
        user: req.user ? req.user._id : undefined,
        guestName: guestName || (req.user ? req.user.name : 'Guest'),
        messages: [],
      });
    } else if (!session.user && req.user) {
      // Link user info to existing anonymous session if user is logged in now
      session.user = req.user._id;
      session.guestName = req.user.name;
    }

    // Add user message
    session.messages.push({
      from: 'user',
      text,
    });
    
    // Auto-update seen receipt
    session.lastSeenByUser = new Date();
    
    await session.save();

    // Forward to Telegram
    const customerName = session.guestName || 'Customer';
    await sendToTelegram(sessionId, customerName, text);

    if (req.io) {
      req.io.to(sessionId).emit('receive_message', session.messages);
      req.io.to('admin').emit('update_sessions');
    }

    res.status(201).json({ success: true, messages: session.messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update seen receipt
router.post('/seen', optionalProtect, async (req, res) => {
  try {
    const { sessionId, role } = req.body;
    if (!sessionId || !role) {
      return res.status(400).json({ message: 'Session ID and role are required' });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (role === 'admin') {
      session.lastSeenByAdmin = new Date();
    } else {
      session.lastSeenByUser = new Date();
    }
    await session.save();

    res.json({ success: true, lastSeenByUser: session.lastSeenByUser, lastSeenByAdmin: session.lastSeenByAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update typing status
router.post('/typing', optionalProtect, async (req, res) => {
  try {
    const { sessionId, role } = req.body;
    if (!sessionId || !role) {
      return res.status(400).json({ message: 'Session ID and role are required' });
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Set typing expiration to 4 seconds from now
    const expiration = new Date(Date.now() + 4000);
    if (role === 'admin') {
      session.adminTypingUntil = expiration;
    } else {
      session.userTypingUntil = expiration;
    }
    await session.save();

    res.json({ success: true, userTypingUntil: session.userTypingUntil, adminTypingUntil: session.adminTypingUntil });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
