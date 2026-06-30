import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Order from '../models/Order.js';
import PaymentLog from '../models/PaymentLog.js';
import RefundRequest from '../models/RefundRequest.js';
import Stripe from 'stripe';
import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
import { validateOrderStock, fulfillOrderStock } from '../utils/orderFulfillment.js';
import { awardLoyaltyPoints } from '../utils/loyalty.js';

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

function isBakongPaymentSuccess(bakongResponse) {
  // Bakong success: responseCode 0 + transaction data with hash (no "status" field)
  return (
    bakongResponse?.responseCode === 0 &&
    bakongResponse?.data &&
    typeof bakongResponse.data === 'object' &&
    (bakongResponse.data.hash || bakongResponse.data.fromAccountId)
  );
}

// Initialize Stripe (uses dummy key if not provided in .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// @route   POST /api/payments/stripe/create-checkout-session
// @desc    Create a Stripe Checkout Session
// @access  Private
router.post('/stripe/create-checkout-session', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const stockCheck = await validateOrderStock(orderItems);
    if (!stockCheck.ok) {
      return res.status(400).json({ message: stockCheck.message });
    }

    // 1. Create the Order in the database first (marked as unpaid)
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x._id,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod: 'Stripe',
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: false,
    });

    const createdOrder = await order.save();

    // 2. Map items for Stripe
    const line_items = orderItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
      },
      quantity: item.qty,
    }));
    
    // 3. Create Stripe Session
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/success?order_id=${createdOrder._id}`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout`,
        client_reference_id: createdOrder._id.toString(),
      });

      res.status(200).json({ sessionId: session.id, url: session.url, orderId: createdOrder._id });
    } catch (stripeError) {
      console.warn("Stripe error (likely invalid API key). Returning dummy success URL for prototyping.");
      res.status(200).json({ 
        url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/success?order_id=${createdOrder._id}&prototype=true`, 
        orderId: createdOrder._id 
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
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
    
    // Fulfill the purchase
    const orderId = session.client_reference_id;
    try {
      const order = await Order.findById(orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: session.payment_intent,
          status: session.payment_status,
          update_time: new Date().toISOString(),
          email_address: session.customer_details?.email,
        };
        await order.save();

        const stockResult = await fulfillOrderStock(order);
        if (!stockResult.ok) {
          console.error(`Stock deduction failed for Stripe order ${orderId}:`, stockResult.message);
        }

        const paymentLog = new PaymentLog({
          order: order._id,
          user: order.user,
          gateway: 'Stripe',
          status: 'success',
          amount: session.amount_total / 100,
          currency: session.currency.toUpperCase(),
          transactionId: session.payment_intent,
          webhookData: session,
          errorMessage: ''
        });
        await paymentLog.save();
        console.log(`Order ${orderId} successfully marked as paid via Stripe webhook.`);
      }
    } catch (dbError) {
      console.error('Error updating order in database after Stripe webhook:', dbError);
    }
  }

  res.status(200).send();
});
// @route   POST /api/payments/khqr/generate
// @desc    Generate a KHQR string for the order
// @access  Private
router.post('/khqr/generate', protect, async (req, res) => {
  try {
    console.log('--- KHQR GENERATE REQUEST RECEIVED ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { orderItems, shippingAddress, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    if (!orderItems || (orderItems && orderItems.length === 0)) {
      console.error('Validation failed: No order items');
      return res.status(400).json({ message: 'No order items' });
    }

    const stockCheck = await validateOrderStock(orderItems);
    if (!stockCheck.ok) {
      return res.status(400).json({ message: stockCheck.message });
    }

    console.log('Creating order in DB...');    // 1. Create the Order in the database (marked as unpaid)
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x._id,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod: 'KHQR',
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: false,
    });

    const createdOrder = await order.save();
    console.log('Order created successfully with ID:', createdOrder._id);

    // 2. Generate KHQR payload using bakong-khqr
    const bakongAccount = process.env.BAKONG_ACCOUNT_ID || 'test_merchant@bakong';
    console.log('Using bakong account:', bakongAccount);
    
    const formattedAmount = Number(Number(totalPrice).toFixed(2));
    console.log('Formatted amount:', formattedAmount);

    const optionalData = {
      currency: khqrData.currency.usd,
      amount: formattedAmount,
      mobileNumber: "85512345678",
      storeLabel: "Modern E-Commerce",
      terminalLabel: "Online Checkout",
      purposeOfTransaction: "Order " + createdOrder._id.toString().slice(-8),
      languagePreference: "km",
      merchantNameAlternateLanguage: "Modern E-Commerce",
      merchantCityAlternateLanguage: "Phnom Penh",
      // Add expiration for dynamic QR (1 hour from now)
      expirationTimestamp: Date.now() + 60 * 60 * 1000,
    };
    console.log('Optional data prepared:', JSON.stringify(optionalData));

    const individualInfo = new IndividualInfo(
      bakongAccount,
      "Modern E-Commerce",
      "Phnom Penh",
      optionalData
    );
    console.log('IndividualInfo instantiated');

    const khqr = new BakongKHQR();
    console.log('BakongKHQR instantiated');
    
    const qrPayload = khqr.generateIndividual(individualInfo);
    console.log('QR Payload generated:', JSON.stringify(qrPayload));

    if (qrPayload.status && qrPayload.status.code === 0) {
       createdOrder.khqrMd5 = qrPayload.data.md5;
       await createdOrder.save();
       console.log('QR Payload success, sending 200 OK');
       res.status(200).json({ 
         qrString: qrPayload.data.qr, 
         md5: qrPayload.data.md5,
         orderId: createdOrder._id 
       });
    } else {
       console.error('Failed to generate KHQR payload:', JSON.stringify(qrPayload, null, 2));
       const errorMessage = qrPayload?.status?.message || 'Failed to generate KHQR';
       res.status(400).json({ message: errorMessage, error: qrPayload });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
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
    const response = await fetch(`${bakongApiUrl}/check_transaction_by_md5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bakongToken}`,
      },
      body: JSON.stringify({ md5: order.khqrMd5 }),
    });

    const data = await response.json();

    if (isBakongPaymentSuccess(data)) {
      await markKhqrOrderPaid(order, data.data);
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

// @route   PUT /api/payments/:id/pay
// @desc    Update order to paid (for Prototype manual verification or Webhook fallback)
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id || 'prototype_mock_id',
        status: req.body.status || 'completed',
        update_time: req.body.update_time || new Date().toISOString(),
        email_address: req.body.email_address || req.user.email,
      };

      const stockResult = await fulfillOrderStock(order);
      if (!stockResult.ok) {
        return res.status(400).json({ message: stockResult.message });
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/payments/mock/generate
// @desc    Generate a mock checkout for ABA Pay, Wing, ACLEDA
// @access  Private
router.post('/mock/generate', protect, async (req, res) => {
  try {
    const { gateway, orderItems, shippingAddress, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const stockCheck = await validateOrderStock(orderItems);
    if (!stockCheck.ok) {
      return res.status(400).json({ message: stockCheck.message });
    }

    // 1. Create the Order in the database (marked as unpaid)
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x._id,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod: gateway, // ABA Pay, Wing, ACLEDA
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: false,
    });

    const createdOrder = await order.save();
    
    // 2. Return mock checkout URL
    // In production, this would be a call to the actual banking SDK to generate a payment session
    const mockUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/mock-gateway?order_id=${createdOrder._id}&gateway=${encodeURIComponent(gateway)}&amount=${totalPrice}`;
    
    res.status(200).json({ url: mockUrl, orderId: createdOrder._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/payments/webhook/:gateway
// @desc    Mock webhook for incoming payment notifications
// @access  Public
router.post('/webhook/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const { orderId, status, amount, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 1. Create Payment Log
    const paymentLog = new PaymentLog({
      order: order._id,
      user: order.user,
      gateway: gateway,
      status: status === 'success' ? 'success' : 'failed',
      amount: amount || order.totalPrice,
      currency: 'USD',
      transactionId: transactionId || `txn_mock_${Date.now()}`,
      webhookData: req.body,
      errorMessage: status === 'success' ? '' : 'Payment declined by gateway'
    });
    await paymentLog.save();

    // 2. Update Order Status
    if (status === 'success') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: paymentLog.transactionId,
        status: 'completed',
        update_time: new Date().toISOString(),
      };
      
      // Update pipeline status
      order.status = 'paid';
      order.timeline.push({
        status: 'paid',
        note: `Payment confirmed via ${gateway} Webhook`
      });
      await order.save();

      const stockResult = await fulfillOrderStock(order);
      if (!stockResult.ok) {
        console.error(`Stock deduction failed for ${gateway} order ${orderId}:`, stockResult.message);
      }
    }

    res.status(200).json({ message: 'Webhook processed', paymentLog });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: 'Webhook Error' });
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
