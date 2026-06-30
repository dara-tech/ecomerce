import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    audience: {
      type: String,
      enum: ['all', 'subscribers', 'customers'],
      default: 'all',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    stats: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const pushNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    linkUrl: { type: String },
    audience: {
      type: String,
      enum: ['all', 'subscribers', 'customers'],
      default: 'all',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const popupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String },
    ctaText: { type: String },
    ctaUrl: { type: String },
    trigger: {
      type: String,
      enum: ['on_load', 'exit_intent', 'delay'],
      default: 'on_load',
    },
    delaySeconds: { type: Number, default: 3 },
    displayFrequency: {
      type: String,
      enum: ['once', 'session', 'always'],
      default: 'once',
    },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const flashSaleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },
    discountValue: { type: Number, required: true, min: 0 },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    badgeText: { type: String, default: 'Flash Sale' },
  },
  { timestamps: true }
);

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);
const PushNotification = mongoose.model('PushNotification', pushNotificationSchema);
const Popup = mongoose.model('Popup', popupSchema);
const FlashSale = mongoose.model('FlashSale', flashSaleSchema);

export { EmailCampaign, PushNotification, Popup, FlashSale };
