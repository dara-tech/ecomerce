import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Order from '../models/Order.js';
import PaymentLog from '../models/PaymentLog.js';
import RefundRequest from '../models/RefundRequest.js';
import Stripe from 'stripe';
import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
import { validateOrderStock, fulfillOrderStock } from '../utils/orderFulfillment.js';
import { awardLoyaltyPoints } from '../utils/loyalty.js';
import {
  buildPaywayPurchasePayload,
  buildPaywayTranId,
  checkPaywayTransaction,
  isPaywayConfigured,
  isPaywayPaymentApproved,
} from '../utils/payway.js';

const router = express.Router();

async function markKhqrOrderPaid(order, bakongData = {}) {
  if (order.isPaid && order.stockDeducted) return order;

  if (!order.isPaid) {
    const transactionId =
      bakongData.hash ||
      bakongData.externalReference ||
      bakongData.transactionId ||
      order.khqrMd5 ||
      `khqr_${Date.now()}`;

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: transactionId,
      status: 'completed',
      update_time: new Date().toISOString(),
    };
    order.status = 'paid';
    order.timeline.push({
      status: 'paid',
      note: 'Payment confirmed via KHQR (Bakong)',
    });
    await order.save();

    const paymentLog = new PaymentLog({
      order: order._id,
      user: order.user,
      gateway: 'KHQR',
      status: 'success',
      amount: order.totalPrice,
      currency: 'USD',
      transactionId,
      webhookData: bakongData,
      errorMessage: '',
    });
    await paymentLog.save();
  }

  const stockResult = await fulfillOrderStock(order);
  if (!stockResult.ok) {
    console.error(`Stock deduction failed for KHQR order ${order._id}:`, stockResult.message);
  }

  await awardLoyaltyPoints(order);

  return order;
}

async function markStripeOrderPaid(order, session) {
  if (order.isPaid && order.stockDeducted) return order;

  if (!order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: session.payment_intent,
      status: session.payment_status,
      update_time: new Date().toISOString(),
      email_address: session.customer_details?.email,
    };
    order.status = 'paid';
    order.timeline.push({
      status: 'paid',
      note: 'Payment confirmed via Stripe',
    });
    await order.save();

    const paymentLog = new PaymentLog({
      order: order._id,
      user: order.user,
      gateway: 'Stripe',
      status: 'success',
      amount: (session.amount_total || 0) / 100,
      currency: (session.currency || 'usd').toUpperCase(),
      transactionId: session.payment_intent,
      webhookData: session,
      errorMessage: '',
    });
    await paymentLog.save();
  }

  const stockResult = await fulfillOrderStock(order);
  if (!stockResult.ok) {
    console.error(`Stock deduction failed for Stripe order ${order._id}:`, stockResult.message);
  }

  await awardLoyaltyPoints(order);

  return order;
}

async function markPaywayOrderPaid(order, paywayData = {}) {
  if (order.isPaid && order.stockDeducted) return order;

  if (!order.isPaid) {
    const transactionId =
      paywayData.apv ||
      paywayData.tran_id ||
      order.paywayTranId ||
      `payway_${Date.now()}`;

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: transactionId,
      status: 'completed',
      update_time: new Date().toISOString(),
    };
    order.status = 'paid';
    order.timeline.push({
      status: 'paid',
      note: 'Payment confirmed via ABA PayWay',
    });
    await order.save();

    const paymentLog = new PaymentLog({
      order: order._id,
      user: order.user,
      gateway: 'ABA Pay',
      status: 'success',
      amount: order.totalPrice,
      currency: 'USD',
      transactionId,
      webhookData: paywayData,
      errorMessage: '',
    });
    await paymentLog.save();
  }

  const stockResult = await fulfillOrderStock(order);
  if (!stockResult.ok) {
    console.error(`Stock deduction failed for PayWay order ${order._id}:`, stockResult.message);
  }

  await awardLoyaltyPoints(order);

  return order;
}

function isBakongPaymentSuccess(bakongResponse) {
  // Bakong success: responseCode 0 + transaction data with hash (no "status" field)
  return (
    bakongResponse?.responseCode === 0 &&
    bakongResponse?.data &&
    typeof bakongResponse.data === 'object' &&
    (bakongResponse.data.hash || bakongResponse.data.fromAccountId)
  );
}

async function resolvePaymentOrder(req, body, paymentMethod) {
  const {
    existingOrderId,
    orderItems,
    shippingAddress,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = body;

  if (existingOrderId) {
    const order = await Order.findById(existingOrderId);
    if (!order) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    if (order.user.toString() !== req.user._id.toString()) {
      const err = new Error('Not authorized for this order');
      err.status = 403;
      throw err;
    }
    if (order.isPaid) {
      const err = new Error('Order is already paid');
      err.status = 400;
      throw err;
    }
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
      await order.save();
    }
    return order;
  }

  if (!orderItems || orderItems.length === 0) {
    const err = new Error('No order items');
    err.status = 400;
    throw err;
  }

  const stockCheck = await validateOrderStock(orderItems);
  if (!stockCheck.ok) {
    const err = new Error(stockCheck.message);
    err.status = 400;
    throw err;
  }

  const order = new Order({
    orderItems: orderItems.map((x) => ({
      ...x,
      product: x._id || x.product,
    })),
    user: req.user._id,
    shippingAddress,
    paymentMethod: paymentMethod || body.paymentMethod || 'Online',
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: false,
  });

  return order.save();
}

function paymentRouteError(res, error) {
  const status = error.status || 500;
  res.status(status).json({ message: error.message || 'Server Error' });
}

/** Stripe rejects empty/invalid image URLs — omit them instead of passing []. */
function stripeHttpsImage(image) {
  if (typeof image !== 'string') return undefined;
  const trimmed = image.trim();
  if (!trimmed || !/^https:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

function buildStripeLineItems(items) {
  return items.map((item) => {
    const name = String(item.name || 'Product').slice(0, 250);
    const rawAmount = Math.round(Number(item.price) * 100);
    const unit_amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 100;
    const quantity = Math.max(1, Math.round(Number(item.qty) || 1));

    const product_data = { name };
    const image = stripeHttpsImage(item.image);
    if (image) product_data.images = [image];

    return {
      price_data: {
        currency: 'usd',
        product_data,
        unit_amount,
      },
      quantity,
    };
  });
}

function appendStripeFeeLineItems(line_items, taxPrice, shippingPrice) {
  const taxCents = Math.round(Number(taxPrice) * 100);
  if (Number.isFinite(taxCents) && taxCents > 0) {
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Tax' },
        unit_amount: taxCents,
      },
      quantity: 1,
    });
  }

  const shipCents = Math.round(Number(shippingPrice) * 100);
  if (Number.isFinite(shipCents) && shipCents > 0) {
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Shipping' },
        unit_amount: shipCents,
      },
      quantity: 1,
    });
  }

  return line_items;
}

// Initialize Stripe (uses dummy key if not provided in .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// @route   POST /api/payments/stripe/create-checkout-session
// @desc    Create a Stripe Checkout Session
// @access  Private
router.post('/stripe/create-checkout-session', protect, async (req, res) => {
  try {
    const { orderItems, existingOrderId } = req.body;

    const order = await resolvePaymentOrder(req, req.body, 'Stripe');
    const items = existingOrderId
      ? order.orderItems
      : orderItems;

    const line_items = appendStripeFeeLineItems(
      buildStripeLineItems(items),
      req.body.taxPrice ?? order.taxPrice,
      req.body.shippingPrice ?? order.shippingPrice
    );

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${clientUrl}/checkout/success?order_id=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/checkout${existingOrderId ? `?payOrder=${order._id}` : ''}`,
        client_reference_id: order._id.toString(),
      });

      res.status(200).json({ sessionId: session.id, url: session.url, orderId: order._id });
    } catch (stripeError) {
      console.error('Stripe checkout session error:', stripeError);
      res.status(502).json({
        message:
          stripeError.message ||
          'Failed to initialize Stripe checkout. Verify STRIPE_SECRET_KEY is configured.',
      });
    }
  } catch (error) {
    console.error(error);
    paymentRouteError(res, error);
  }
});
// @route   POST /api/payments/stripe/webhook
// @desc    Handle Stripe Webhook
// @access  Public
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.client_reference_id;
    try {
      const order = await Order.findById(orderId);
      if (order) {
        await markStripeOrderPaid(order, session);
        console.log(`Order ${orderId} successfully marked as paid via Stripe webhook.`);
      }
    } catch (dbError) {
      console.error('Error updating order in database after Stripe webhook:', dbError);
    }
  }

  res.status(200).send();
});

// @route   POST /api/payments/stripe/verify-session
// @desc    Confirm Stripe payment on success page (fallback when webhook is delayed/missing)
// @access  Private
router.post('/stripe/verify-session', protect, async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;
    if (!sessionId || !orderId) {
      return res.status(400).json({ message: 'sessionId and orderId are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    if (order.isPaid) {
      return res.status(200).json({ isPaid: true, orderId: order._id, status: 'paid' });
    }

    const session = await stripe.checkout.sessions.retrieve(String(sessionId));
    if (session.client_reference_id !== order._id.toString()) {
      return res.status(400).json({ message: 'Stripe session does not match this order' });
    }

    const paid =
      session.payment_status === 'paid' ||
      (session.status === 'complete' && session.payment_status !== 'unpaid');

    if (paid) {
      await markStripeOrderPaid(order, session);
      return res.status(200).json({ isPaid: true, orderId: order._id, status: 'paid' });
    }

    return res.status(200).json({
      isPaid: false,
      status: session.payment_status || session.status || 'pending',
    });
  } catch (error) {
    console.error('Stripe verify-session error:', error);
    res.status(502).json({
      message: error.message || 'Could not verify Stripe payment',
    });
  }
});

// @route   POST /api/payments/khqr/generate
// @desc    Generate a KHQR string for the order
// @access  Private
router.post('/khqr/generate', protect, async (req, res) => {
  try {
    console.log('--- KHQR GENERATE REQUEST RECEIVED ---');

    const order = await resolvePaymentOrder(req, req.body, 'KHQR');
    const formattedAmount = Number(Number(order.totalPrice).toFixed(2));

    const bakongAccount = process.env.BAKONG_ACCOUNT_ID || 'test_merchant@bakong';

    const optionalData = {
      currency: khqrData.currency.usd,
      amount: formattedAmount,
      mobileNumber: "85512345678",
      storeLabel: "Modern E-Commerce",
      terminalLabel: "Online Checkout",
      purposeOfTransaction: "Order " + order._id.toString().slice(-8),
      languagePreference: "km",
      merchantNameAlternateLanguage: "Modern E-Commerce",
      merchantCityAlternateLanguage: "Phnom Penh",
      expirationTimestamp: Date.now() + 60 * 60 * 1000,
    };

    const individualInfo = new IndividualInfo(
      bakongAccount,
      "Modern E-Commerce",
      "Phnom Penh",
      optionalData
    );

    const khqr = new BakongKHQR();
    const qrPayload = khqr.generateIndividual(individualInfo);

    if (qrPayload.status && qrPayload.status.code === 0) {
       order.khqrMd5 = qrPayload.data.md5;
       await order.save();
       res.status(200).json({ 
         qrString: qrPayload.data.qr, 
         md5: qrPayload.data.md5,
         orderId: order._id 
       });
    } else {
       console.error('Failed to generate KHQR payload:', JSON.stringify(qrPayload, null, 2));
       const errorMessage = qrPayload?.status?.message || 'Failed to generate KHQR';
       res.status(400).json({ message: errorMessage, error: qrPayload });
    }
  } catch (error) {
    console.error(error);
    paymentRouteError(res, error);
  }
});

// @route   GET /api/payments/khqr/check-status/:orderId
// @desc    Check KHQR transaction status via Bakong OpenAPI and mark order paid
// @access  Private
router.get('/khqr/check-status/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    if (order.isPaid) {
      if (!order.stockDeducted) {
        await fulfillOrderStock(order);
      }
      return res.status(200).json({
        message: 'Order already paid',
        status: 'SUCCESS',
        isPaid: true,
        orderId: order._id,
      });
    }

    if (!order.khqrMd5 && req.query.md5) {
      order.khqrMd5 = String(req.query.md5);
      await order.save();
    }

    if (!order.khqrMd5) {
      return res.status(400).json({ message: 'No KHQR payment associated with this order' });
    }

    const bakongToken = process.env.BAKONG_TOKEN;
    if (!bakongToken) {
      return res.status(200).json({
        message: 'Bakong token not configured; waiting for order update',
        status: 'PENDING',
        isPaid: false,
      });
    }

    const bakongApiUrl = process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh/v1';
    let response;
    try {
      response = await fetch(`${bakongApiUrl}/check_transaction_by_md5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bakongToken}`,
        },
        body: JSON.stringify({ md5: order.khqrMd5 }),
      });
    } catch (fetchError) {
      console.error('Bakong network error:', fetchError);
      return res.status(200).json({
        message: 'Payment provider unreachable; still waiting',
        status: 'PENDING',
        isPaid: false,
        providerUnavailable: true,
      });
    }

    const rawBody = await response.text();
    let data;
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      console.error('Bakong non-JSON response:', rawBody.slice(0, 200));
      return res.status(200).json({
        message: 'Unexpected payment provider response',
        status: 'PENDING',
        isPaid: false,
        providerUnavailable: true,
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        message: data.responseMessage || 'Payment still pending',
        status: 'PENDING',
        isPaid: false,
        bakongResponseCode: data.responseCode ?? response.status,
      });
    }

    if (isBakongPaymentSuccess(data)) {
      try {
        await markKhqrOrderPaid(order, data.data);
      } catch (fulfillError) {
        console.error('KHQR fulfill error:', fulfillError);
        return res.status(500).json({ message: 'Payment received but order update failed' });
      }
      return res.status(200).json({
        message: 'Payment confirmed',
        status: 'SUCCESS',
        isPaid: true,
        orderId: order._id,
        data: data.data,
      });
    }

    res.status(200).json({
      message: data.responseMessage || 'Status checked',
      status: 'PENDING',
      isPaid: false,
      bakongResponseCode: data.responseCode,
    });
  } catch (error) {
    console.error('Bakong check error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/payments/payway/create-purchase
// @desc    Create order and signed PayWay checkout form fields
// @access  Private
router.post('/payway/create-purchase', protect, async (req, res) => {
  try {
    if (!isPaywayConfigured()) {
      return res.status(503).json({
        message: 'PayWay is not configured. Set PAYWAY_MERCHANT_ID and PAYWAY_PUBLIC_KEY.',
      });
    }

    const order = await resolvePaymentOrder(req, req.body, 'ABA Pay');
    if (!order.paywayTranId) {
      order.paywayTranId = buildPaywayTranId(order._id);
      await order.save();
    }

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const callbackBaseUrl = (
      process.env.BACKEND_PUBLIC_URL ||
      `http://127.0.0.1:${process.env.PORT || 5001}/api`
    ).replace(/\/$/, '');

    const { firstName, lastName, email, phone, paymentOption } = req.body;
    const purchase = buildPaywayPurchasePayload({
      order,
      firstname: firstName || req.user?.name?.split(' ')[0],
      lastname: lastName || req.user?.name?.split(' ').slice(1).join(' '),
      email: email || req.user?.email || req.body.guestEmail,
      phone,
      clientUrl,
      callbackBaseUrl,
      paymentOption: paymentOption || 'abapay',
    });

    res.status(200).json({
      orderId: order._id,
      tranId: order.paywayTranId,
      checkoutScript: 'https://checkout.payway.com.kh/plugins/checkout2-0.js',
      ...purchase,
    });
  } catch (error) {
    console.error('PayWay create-purchase error:', error);
    paymentRouteError(res, error);
  }
});

// @route   POST /api/payments/payway/callback
// @desc    PayWay pushback notification
// @access  Public
router.post('/payway/callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { tran_id, status, apv, return_params } = req.body;

    let order =
      (return_params && (await Order.findById(return_params))) ||
      (tran_id && (await Order.findOne({ paywayTranId: tran_id })));

    if (!order) {
      console.warn('PayWay callback: order not found', { tran_id, return_params });
      return res.status(200).send('OK');
    }

    if (isPaywayPaymentApproved({ status })) {
      await markPaywayOrderPaid(order, req.body);
      console.log(`Order ${order._id} marked paid via PayWay callback (apv: ${apv}).`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayWay callback error:', error);
    res.status(200).send('OK');
  }
});

// @route   GET /api/payments/payway/check-status/:orderId
// @desc    Verify PayWay transaction and mark order paid
// @access  Private
router.get('/payway/check-status/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    if (order.isPaid) {
      if (!order.stockDeducted) {
        await fulfillOrderStock(order);
      }
      return res.status(200).json({
        message: 'Order already paid',
        status: 'SUCCESS',
        isPaid: true,
        orderId: order._id,
      });
    }

    if (!order.paywayTranId) {
      return res.status(400).json({ message: 'No PayWay transaction for this order' });
    }

    if (!isPaywayConfigured()) {
      return res.status(200).json({
        message: 'PayWay not configured',
        status: 'PENDING',
        isPaid: false,
      });
    }

    let result;
    try {
      result = await checkPaywayTransaction(order.paywayTranId);
    } catch (fetchError) {
      console.error('PayWay network error:', fetchError);
      return res.status(200).json({
        message: 'Payment provider unreachable',
        status: 'PENDING',
        isPaid: false,
        providerUnavailable: true,
      });
    }

    if (!result.ok || !result.data) {
      return res.status(200).json({
        message: 'Could not verify PayWay transaction',
        status: 'PENDING',
        isPaid: false,
        providerUnavailable: true,
      });
    }

    if (isPaywayPaymentApproved(result.data)) {
      await markPaywayOrderPaid(order, result.data);
      return res.status(200).json({
        message: 'Payment confirmed',
        status: 'SUCCESS',
        isPaid: true,
        orderId: order._id,
        data: result.data,
      });
    }

    res.status(200).json({
      message: result.data.description || 'Payment pending',
      status: 'PENDING',
      isPaid: false,
      paywayStatus: result.data.status,
    });
  } catch (error) {
    console.error('PayWay check-status error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/payments/logs
// @desc    Get all payment logs
// @access  Private/Admin
router.get('/logs', protect, admin, async (req, res) => {
  try {
    const logs = await PaymentLog.find()
      .populate('user', 'id name email')
      .populate('order', 'id totalPrice')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Fetch logs error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/payments/refunds
// @desc    Get all refund requests
// @access  Private/Admin
router.get('/refunds', protect, admin, async (req, res) => {
  try {
    const refunds = await RefundRequest.find()
      .populate('user', 'id name email')
      .populate('order', 'id totalPrice')
      .sort({ createdAt: -1 });
    res.json(refunds);
  } catch (error) {
    console.error('Fetch refunds error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/payments/refunds/:id
// @desc    Update refund status (Approve/Reject)
// @access  Private/Admin
router.put('/refunds/:id', protect, admin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const refund = await RefundRequest.findById(req.params.id);

    if (refund) {
      refund.status = status || refund.status;
      refund.adminNotes = adminNotes || refund.adminNotes;
      const updatedRefund = await refund.save();

      // If approved, update order status
      if (status === 'approved' || status === 'processed') {
        const order = await Order.findById(refund.order);
        if (order) {
          order.status = 'refunded';
          order.timeline.push({
            status: 'refunded',
            note: `Refund approved: ${adminNotes || 'No notes'}`
          });
          await order.save();
        }
      }

      res.json(updatedRefund);
    } else {
      res.status(404).json({ message: 'Refund request not found' });
    }
  } catch (error) {
    console.error('Update refund error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
