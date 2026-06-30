import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  storeInfo: {
    name: { type: String, default: 'LUMINA' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  currency: {
    default: { type: String, default: 'USD' },
    format: { type: String, default: '$' },
  },
  taxes: {
    rate: { type: Number, default: 0 },
    enabled: { type: Boolean, default: false },
  },
  languages: {
    supported: [{ type: String }],
    default: { type: String, default: 'en' },
  },
  themes: {
    primaryColor: { type: String, default: '#000000' },
    mode: { type: String, default: 'light' },
  },
  smtp: {
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
  },
  paymentGateways: {
    stripe: {
      publicKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
    },
    paypal: {
      clientId: { type: String, default: '' },
      secret: { type: String, default: '' },
    },
  },
  shippingProviders: {
    methods: [
      {
        name: { type: String },
        rate: { type: Number },
      }
    ],
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
