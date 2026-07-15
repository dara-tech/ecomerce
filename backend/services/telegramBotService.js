import TelegramBot from 'node-telegram-bot-api';
import { ChatSession } from '../models/Chat.js';
import { NotificationSettings } from '../models/OpsModels.js';

let bot = null;
let targetChatId = null;

export const initTelegramBot = async () => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.log('TELEGRAM_BOT_TOKEN not found. Chat bot disabled.');
      return;
    }

    // Try to get chat ID from settings
    const settings = await NotificationSettings.findOne();
    targetChatId = settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!targetChatId) {
      console.log('No Telegram Chat ID configured. Chat bot disabled.');
      return;
    }

    bot = new TelegramBot(token, { polling: true });
    console.log('Telegram bot initialized and polling started.');

    bot.on('message', async (msg) => {
      // Only process messages in the designated admin chat group
      if (msg.chat.id.toString() !== targetChatId.toString()) return;

      // Ensure it's a reply to a previous bot message
      if (!msg.reply_to_message || !msg.reply_to_message.text) return;

      const originalText = msg.reply_to_message.text;
      
      // Extract sessionId using regex (assuming we append #session_XYZ to messages)
      const sessionMatch = originalText.match(/#session_([A-Za-z0-9_-]+)/);
      if (!sessionMatch) return;

      const sessionId = sessionMatch[1];
      const replyText = msg.text;

      if (!replyText) return;

      try {
        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
          bot.sendMessage(targetChatId, `⚠️ Chat session ${sessionId} not found.`);
          return;
        }

        session.messages.push({
          from: 'admin',
          text: replyText,
          telegramMessageId: msg.message_id.toString(),
        });
        await session.save();

        // Optionally react or confirm
        // bot.sendMessage(targetChatId, `✅ Reply sent to customer.`);
      } catch (err) {
        console.error('Error saving admin reply:', err);
      }
    });

  } catch (error) {
    console.error('Failed to initialize Telegram Bot:', error);
  }
};

export const sendToTelegram = async (sessionId, customerName, messageText) => {
  if (!bot || !targetChatId) return null;
  
  const text = `💬 New message from ${customerName}:\n\n"${messageText}"\n\n#session_${sessionId}`;
  
  try {
    const sentMsg = await bot.sendMessage(targetChatId, text);
    return sentMsg.message_id.toString();
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return null;
  }
};
