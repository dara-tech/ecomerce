import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true },
    telegramMessageId: { type: String }, // To map replies from Telegram
  },
  { timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, if logged in
    guestName: { type: String }, // Optional, if guest provided a name
    telegramTopicId: { type: String }, // If using Telegram topics/forum groups
    messages: [chatMessageSchema],
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    lastSeenByUser: { type: Date, default: Date.now },
    lastSeenByAdmin: { type: Date, default: Date.now },
    userTypingUntil: { type: Date, default: Date.now },
    adminTypingUntil: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
