import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    countries: [{ type: String }],
    regions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const shippingMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingZone' },
    type: { type: String, enum: ['flat', 'weight', 'free'], default: 'flat' },
    baseFee: { type: Number, default: 0 },
    perKgFee: { type: Number, default: 0 },
    freeAbove: { type: Number, default: 0 },
    minDays: { type: Number, default: 2 },
    maxDays: { type: Number, default: 5 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String },
    city: { type: String },
    country: { type: String, default: 'Cambodia' },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const stockTransferSchema = new mongoose.Schema(
  {
    fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['pending', 'in_transit', 'completed', 'cancelled'], default: 'pending' },
    notes: { type: String },
  },
  { timestamps: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String },
        quantity: { type: Number, required: true },
        unitCost: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ['draft', 'ordered', 'received', 'cancelled'], default: 'draft' },
    expectedDate: { type: Date },
    receivedAt: { type: Date },
    totalCost: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

const stockHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    change: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['order', 'transfer', 'purchase', 'adjustment', 'return', 'cancel'],
      default: 'adjustment',
    },
    reference: { type: String },
    note: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['percent', 'fixed', 'free_shipping'], required: true },
    value: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 1 },
    expiresAt: { type: Date },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'spam'], default: 'pending' },
    spamScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['new_order', 'refund_request', 'low_stock', 'new_customer', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const notificationSettingsSchema = new mongoose.Schema(
  {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    telegramEnabled: { type: Boolean, default: false },
    telegramChatId: { type: String, default: '' },
    smsProvider: { type: String, default: '' },
    notifyNewOrder: { type: Boolean, default: true },
    notifyRefundRequest: { type: Boolean, default: true },
    notifyLowStock: { type: Boolean, default: true },
    notifyNewCustomer: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);
export const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export const Supplier = mongoose.model('Supplier', supplierSchema);
export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
export const StockHistory = mongoose.model('StockHistory', stockHistorySchema);
export const Coupon = mongoose.model('Coupon', couponSchema);
export const Review = mongoose.model('Review', reviewSchema);
export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
export const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);
