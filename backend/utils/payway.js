import crypto from 'crypto';

function paywayPublicKey() {
  return process.env.PAYWAY_PUBLIC_KEY || '';
}

function paywayMerchantId() {
  return process.env.PAYWAY_MERCHANT_ID || '';
}

function paywayApiUrl() {
  return (
    process.env.PAYWAY_API_URL ||
    'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase'
  );
}

function paywayCheckUrl() {
  const purchaseUrl = paywayApiUrl();
  return purchaseUrl.replace('/payments/purchase', '/payments/check-transaction');
}

/** YYYYmmddHis in UTC */
export function paywayReqTime(date = new Date()) {
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return (
    String(date.getUTCFullYear()) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds())
  );
}

export function paywayHmacSha512Base64(data, key) {
  return crypto.createHmac('sha512', key).update(data).digest('base64');
}

export function encodePaywayItems(orderItems) {
  const rows = orderItems.map((item) => ({
    name: String(item.name || 'Product').slice(0, 50),
    quantity: String(item.qty ?? 1),
    price: Number(item.price || 0).toFixed(2),
  }));
  return Buffer.from(JSON.stringify(rows)).toString('base64');
}

export function buildPaywayTranId(orderId) {
  const id = String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  const ts = String(Date.now()).slice(-10);
  return `LN${id}${ts}`.slice(0, 20);
}

export function buildPurchaseHash(fields) {
  const key = paywayPublicKey();
  const payload =
    (fields.req_time || '') +
    (fields.merchant_id || '') +
    (fields.tran_id || '') +
    String(fields.amount ?? '') +
    (fields.items || '') +
    (fields.shipping || '') +
    (fields.ctid || '') +
    (fields.pwt || '') +
    (fields.firstname || '') +
    (fields.lastname || '') +
    (fields.email || '') +
    (fields.phone || '') +
    (fields.type || '') +
    (fields.payment_option || '') +
    (fields.return_url || '') +
    (fields.cancel_url || '') +
    (fields.continue_success_url || '') +
    (fields.return_deeplink || '') +
    (fields.currency || '') +
    (fields.custom_fields || '') +
    (fields.return_params || '');

  return paywayHmacSha512Base64(payload, key);
}

export function buildCheckTransactionHash(req_time, merchant_id, tran_id) {
  const key = paywayPublicKey();
  return paywayHmacSha512Base64(String(req_time) + String(merchant_id) + String(tran_id), key);
}

export function buildPaywayPurchasePayload({
  order,
  firstname,
  lastname,
  email,
  phone,
  clientUrl,
  callbackBaseUrl,
  paymentOption = 'abapay',
}) {
  const merchant_id = paywayMerchantId();
  const req_time = paywayReqTime();
  const tran_id = order.paywayTranId;
  const amount = Number(order.totalPrice).toFixed(2);
  const items = encodePaywayItems(order.orderItems);
  const currency = 'USD';
  const type = 'purchase';

  const baseClient = String(clientUrl || 'http://localhost:3000').replace(/\/$/, '');
  const continue_success_url = `${baseClient}/checkout/success?order_id=${order._id}`;
  const cancel_url = `${baseClient}/checkout?payOrder=${order._id}`;

  const callbackBase = String(callbackBaseUrl || baseClient).replace(/\/$/, '');
  const return_url = Buffer.from(`${callbackBase}/payments/payway/callback`).toString('base64');
  const return_params = order._id.toString();

  const fields = {
    req_time,
    merchant_id,
    tran_id,
    firstname: String(firstname || 'Customer').slice(0, 20).replace(/[^\w\s-]/g, ''),
    lastname: String(lastname || 'Guest').slice(0, 20).replace(/[^\w\s-]/g, ''),
    email: String(email || 'customer@example.com').slice(0, 50),
    phone: String(phone || '090000000').slice(0, 20),
    amount,
    type,
    payment_option: paymentOption,
    items,
    currency,
    return_url,
    cancel_url,
    continue_success_url,
    return_params,
    shipping: '',
    ctid: '',
    pwt: '',
    return_deeplink: '',
    custom_fields: '',
  };

  fields.hash = buildPurchaseHash(fields);

  return {
    action: paywayApiUrl(),
    fields: {
      ...fields,
      view_type: 'checkout',
    },
  };
}

export async function checkPaywayTransaction(tran_id) {
  const merchant_id = paywayMerchantId();
  const req_time = paywayReqTime();
  const hash = buildCheckTransactionHash(req_time, merchant_id, tran_id);

  const body = new URLSearchParams({
    req_time,
    merchant_id,
    tran_id,
    hash,
  });

  const response = await fetch(paywayCheckUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      language: 'en',
    },
    body,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, raw: text.slice(0, 300), status: response.status };
  }

  return { ok: response.ok, data, status: response.status };
}

export function isPaywayPaymentApproved(data) {
  const status = data?.status;
  return status === 0 || status === '0';
}

export function isPaywayConfigured() {
  return Boolean(paywayMerchantId() && paywayPublicKey());
}
