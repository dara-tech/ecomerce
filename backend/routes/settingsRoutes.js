import express from 'express';
import Setting from '../models/Setting.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public store settings (currency, languages, theme)
router.get('/public', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    res.json({
      storeName: settings.storeInfo?.name || 'Lumina Store',
      currency: settings.currency || { default: 'USD', format: '$' },
      languages: settings.languages || { supported: ['en', 'km'], default: 'en' },
      theme: settings.themes || { mode: 'system', primaryColor: '#000000' },
      logoUrl: settings.logoUrl || '',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/settings
// Retrieve global settings
router.get('/', protect, admin, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/settings
// Update global settings
router.put('/', protect, admin, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    
    // Dynamically update fields based on request body
    const {
      storeInfo,
      currency,
      taxes,
      languages,
      themes,
      smtp,
      paymentGateways,
      shippingProviders,
      socialLinks,
      logoUrl,
      faviconUrl,
    } = req.body;

    if (storeInfo) settings.storeInfo = storeInfo;
    if (currency) settings.currency = currency;
    if (taxes) settings.taxes = taxes;
    if (languages) settings.languages = languages;
    if (themes) settings.themes = themes;
    if (smtp) settings.smtp = smtp;
    if (paymentGateways) settings.paymentGateways = paymentGateways;
    if (shippingProviders) settings.shippingProviders = shippingProviders;
    if (socialLinks) settings.socialLinks = socialLinks;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
