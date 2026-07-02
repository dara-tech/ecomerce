import { getApiUrl } from '@/lib/api';

export type PaymentVerifyResult = {
  paid: boolean;
  providerUnavailable?: boolean;
  message?: string;
  authExpired?: boolean;
};

function parseVerifyPayload(data: Record<string, unknown> | null): PaymentVerifyResult {
  if (!data) return { paid: false };
  if (data.isPaid || data.status === 'SUCCESS') {
    return { paid: true };
  }
  return {
    paid: false,
    providerUnavailable: Boolean(data.providerUnavailable),
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

async function fetchVerifyPath(
  path: string,
  token: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  let data: Record<string, unknown> | null = null;
  if (res.ok) {
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  return { ok: res.ok, status: res.status, data };
}

async function fetchOrderPaid(orderId: string, token: string, signal?: AbortSignal) {
  const orderRes = await fetch(`${getApiUrl()}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!orderRes.ok) return false;
  const order = await orderRes.json();
  return Boolean(order?.isPaid);
}

/** Verify payment — uses unified route when available, legacy KHQR/PayWay routes as fallback. */
export async function verifyPaymentStatus(
  orderId: string,
  token: string,
  options?: { md5?: string | null; signal?: AbortSignal }
): Promise<PaymentVerifyResult> {
  const md5Query = options?.md5 ? `?md5=${encodeURIComponent(options.md5)}` : '';
  const signal = options?.signal;

  const unified = await fetchVerifyPath(
    `/payments/verify/${orderId}${md5Query}`,
    token,
    signal
  );

  if (unified.status === 401) {
    return { paid: false, authExpired: true };
  }

  if (unified.ok && unified.data) {
    return parseVerifyPayload(unified.data);
  }

  if (unified.status !== 404 && unified.status !== 0) {
    if (await fetchOrderPaid(orderId, token, signal)) {
      return { paid: true };
    }
    return { paid: false };
  }

  let lastPending: PaymentVerifyResult = { paid: false };

  const khqr = await fetchVerifyPath(
    `/payments/khqr/check-status/${orderId}${md5Query}`,
    token,
    signal
  );

  if (khqr.status === 401) {
    return { paid: false, authExpired: true };
  }

  if (khqr.ok && khqr.data) {
    const parsed = parseVerifyPayload(khqr.data);
    if (parsed.paid) return parsed;
    lastPending = parsed;
  }

  const payway = await fetchVerifyPath(`/payments/payway/check-status/${orderId}`, token, signal);

  if (payway.status === 401) {
    return { paid: false, authExpired: true };
  }

  if (payway.ok && payway.data) {
    const parsed = parseVerifyPayload(payway.data);
    if (parsed.paid) return parsed;
    lastPending = parsed;
  }

  if (await fetchOrderPaid(orderId, token, signal)) {
    return { paid: true };
  }

  return lastPending;
}
