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

function paywayBaseUrl() {
  const purchaseUrl = paywayApiUrl();
  return purchaseUrl.replace(/\/payments\/purchase\/?$/, '');
}

function paywayCheckUrl() {
  return `${paywayBaseUrl()}/payments/check-transaction`;
}

function paywayGenerateQrUrl() {
  return `${paywayBaseUrl()}/payments/generate-qr`;
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

export function buildQrHash(fields) {
  const payload =
    (fields.req_time || '') +
    (fields.merchant_id || '') +
    (fields.tran_id || '') +
    String(fields.amount ?? '') +
    (fields.items || '') +
    (fields.first_name || '') +
    (fields.last_name || '') +
    (fields.email || '') +
    (fields.phone || '') +
    (fields.purchase_type || '') +
    (fields.payment_option || '') +
    (fields.callback_url || '') +
    (fields.return_deeplink || '') +
    (fields.currency || '') +
    (fields.custom_fields || '') +
    (fields.return_params || '') +
    (fields.payout || '') +
    String(fields.lifetime ?? '') +
    (fields.qr_image_template || '');

  return paywayHmacSha512Base64(payload, paywayPublicKey());
}

export function buildPaywayQrPayload({
  order,
  firstname,
  lastname,
  email,
  phone,
  callbackBaseUrl,
  paymentOption = 'abapay_khqr',
  lifetime,
  qrImageTemplate,
}) {
  const merchant_id = paywayMerchantId();
  const req_time = paywayReqTime();
  const tran_id = order.paywayTranId;
  const amount = Number(Number(order.totalPrice).toFixed(2));
  const items = encodePaywayItems(order.orderItems);
  const currency = 'USD';
  const purchase_type = 'purchase';
  const qrLifetime = Number(lifetime || process.env.PAYWAY_QR_LIFETIME || 30);
  const qr_image_template =
    qrImageTemplate || process.env.PAYWAY_QR_TEMPLATE || 'template3_color';

  const callbackBase = String(callbackBaseUrl || '').replace(/\/$/, '');
  const callback_url = callbackBase
    ? Buffer.from(`${callbackBase}/payments/payway/callback`).toString('base64')
    : '';

  const fields = {
    req_time,
    merchant_id,
    tran_id,
    first_name: String(firstname || 'Customer').slice(0, 20).replace(/[^\w\s-]/g, ''),
    last_name: String(lastname || 'Guest').slice(0, 20).replace(/[^\w\s-]/g, ''),
    email: String(email || 'customer@example.com').slice(0, 50),
    phone: String(phone || '090000000').slice(0, 20),
    amount,
    currency,
    purchase_type,
    payment_option: paymentOption,
    items,
    callback_url,
    return_deeplink: '',
    custom_fields: '',
    return_params: order._id.toString(),
    payout: '',
    lifetime: qrLifetime,
    qr_image_template,
  };

  fields.hash = buildQrHash(fields);
  return fields;
}

export async function generatePaywayQr(body) {
  const response = await fetch(paywayGenerateQrUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      language: 'en',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, raw: text.slice(0, 500), status: response.status };
  }

  return { ok: response.ok, data, status: response.status };
}

export function isPaywayQrGenerated(data) {
  const code = data?.status?.code;
  return (code === '0' || code === 0) && Boolean(data?.qrString || data?.qrImage);
}

export function isPaywayPaymentApproved(data) {
  if (!data || typeof data !== 'object') return false;

  const payload = data.data && typeof data.data === 'object' ? data.data : data;

  const paymentStatus = String(payload.payment_status ?? data.payment_status ?? '').toUpperCase();
  if (['APPROVED', 'PRE-AUTH', 'PRE_AUTH', 'PREAUTH_APPROVED'].includes(paymentStatus)) {
    return true;
  }

  const paymentStatusCode = payload.payment_status_code ?? data.payment_status_code;
  if (paymentStatusCode === 0 || paymentStatusCode === '0') {
    return true;
  }

  const rawStatus = data.status;
  if (typeof rawStatus === 'number' || typeof rawStatus === 'string') {
    if (rawStatus === 0 || rawStatus === '0') {
      const desc = String(data.description ?? payload.description ?? '').toLowerCase();
      if (desc.includes('pending')) return false;
      return desc.includes('approv') || Boolean(data.apv ?? payload.apv);
    }
    return false;
  }

  if (rawStatus && typeof rawStatus === 'object') {
    const wrapperCode = String(rawStatus.code ?? '');
      if (wrapperCode === '00' || wrapperCode === '0') {
      if (['APPROVED', 'PRE-AUTH', 'PRE_AUTH'].includes(paymentStatus)) return true;
      if (paymentStatusCode === 0 || paymentStatusCode === '0') return true;
    }
  }

  return false;
}

export function isPaywayConfigured() {
  return Boolean(paywayMerchantId() && paywayPublicKey());
}
