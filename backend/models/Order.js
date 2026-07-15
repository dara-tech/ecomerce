import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    vendorEarnings: {
      type: Number,
      default: 0.0,
    },
    isGuest: { type: Boolean, default: false },
    guestEmail: { type: String },
    guestName: { type: String },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
      default: 'pending',
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
      }
    ],
    trackingNumber: {
      type: String,
    },
    customerNotes: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
    khqrMd5: {
      type: String,
    },
    khqrString: {
      type: String,
    },
    paywayTranId: {
      type: String,
    },
    stockDeducted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('save', function () {
  this._isNew = this.isNew;
  this._paymentJustPaid = this.isModified('isPaid') && this.isPaid;
  this._statusJustChanged = this.isModified('status') ? this.status : null;
});

orderSchema.post('save', async function (doc) {
  if (!doc.parentOrder) {
    if (doc._isNew) {
      try {
        const { splitOrderIntoVendorSubOrders } = await import('../utils/multiVendor.js');
        await splitOrderIntoVendorSubOrders(doc);
      } catch (err) {
        console.error('Error in post-save order split hook:', err);
      }
    }

    if (doc._paymentJustPaid) {
      try {
        const { propagateOrderPayment } = await import('../utils/multiVendor.js');
        await propagateOrderPayment(doc);
      } catch (err) {
        console.error('Error in post-save payment propagation hook:', err);
      }
    }

    if (doc._statusJustChanged) {
      try {
        const { propagateOrderStatus } = await import('../utils/multiVendor.js');
        await propagateOrderStatus(doc, doc._statusJustChanged);
      } catch (err) {
        console.error('Error in post-save status propagation hook:', err);
      }
    }
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
