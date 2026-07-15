import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { ChatSession } from './models/Chat.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce';

async function seedChats() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  console.log('Clearing existing chat sessions...');
  await ChatSession.deleteMany({});
  console.log('Cleared existing chat sessions.');

  // Clean up previous seeded customers if any
  console.log('Cleaning up previous seed customers...');
  await User.deleteMany({ email: /seed_customer_/ });

  console.log('Creating 40 mock customer accounts...');
  const customerUsers = [];
  for (let i = 1; i <= 40; i++) {
    const user = await User.create({
      name: `Seeded Member ${i}`,
      email: `seed_customer_${i}@example.com`,
      password: 'password123',
      role: 'customer',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=customer_${i}`
    });
    customerUsers.push(user);
  }

  console.log('Generating 100 highly realistic chat sessions...');
  const sessions = [];

  for (let i = 1; i <= 100; i++) {
    const messages = [];
    const sessionId = `mock_session_${i}`;
    
    // 40% are registered members, 60% are guests
    const isMember = i <= 40;
    const user = isMember ? customerUsers[i - 1] : null;
    const displayName = isMember ? user.name : `Guest Client ${i}`;

    // Random message count between 10 and 30
    const msgCount = Math.floor(Math.random() * 21) + 10;

    // 25% of chats are unread by admin
    const isUnread = i % 4 === 0;

    // 30% of chats are currently online
    const isOnline = i % 3 === 0;

    for (let j = 1; j <= msgCount; j++) {
      let from = j % 2 === 1 ? 'user' : 'admin';
      
      // If it's unread, force the last message to be from 'user'
      if (j === msgCount && isUnread) {
        from = 'user';
      }
      // If it is read, make sure the last message is from 'admin'
      else if (j === msgCount && !isUnread) {
        from = 'admin';
      }

      const text = from === 'user'
        ? `Hi support! This is message #${j} from me (${displayName}). Need help with order status.`
        : `Hello! This is reply #${j} from support. We are checking that details for you right now.`;
      
      // Spacing out timestamps by 2 minutes each
      const createdAt = new Date(Date.now() - (msgCount - j) * 120000);

      messages.push({
        from,
        text,
        createdAt,
        updatedAt: createdAt
      });
    }

    // Set online status timestamp
    const lastSeenByUser = isOnline 
      ? new Date() 
      : new Date(Date.now() - (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000); // 1-5 days ago

    // Set admin seen status timestamp
    const lastMsgTime = messages[messages.length - 1].createdAt.getTime();
    const lastSeenByAdmin = isUnread
      ? new Date(lastMsgTime - 60000) // Admin last saw it 1 minute BEFORE the last message arrived -> Unread
      : new Date(lastMsgTime + 60000); // Admin saw it 1 minute AFTER -> Read

    sessions.push({
      sessionId,
      guestName: isMember ? undefined : displayName,
      user: isMember ? user._id : undefined,
      messages,
      status: 'active',
      lastSeenByUser,
      lastSeenByAdmin,
      userTypingUntil: new Date(0),
      adminTypingUntil: new Date(0),
      createdAt: messages[0].createdAt,
      updatedAt: messages[messages.length - 1].createdAt
    });
  }

  console.log('Inserting sessions into database...');
  await ChatSession.insertMany(sessions);
  console.log('Successfully seeded 100 correct & realistic chat sessions!');

  await mongoose.disconnect();
  console.log('Disconnected from database.');
}

seedChats().catch((err) => {
  console.error('Failed to seed chats:', err);
  process.exit(1);
});
