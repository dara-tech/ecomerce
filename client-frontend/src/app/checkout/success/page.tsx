"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { verifyPaymentStatus } from "@/lib/verifyPayment";
import {
  OrderInfoCard,
  PaymentStatusButton,
  PaymentStatusLayout,
  PaymentStatusLink,
} from "@/components/features/PaymentStatusLayout";

type OrderState = {
  _id: string;
  isPaid: boolean;
  paymentMethod: string;
  totalPrice: number;
  status: string;
};

function isStripeMethod(method?: string) {
  return method?.toLowerCase() === "stripe";
}

function isKhqrMethod(method?: string) {
  const m = method?.toLowerCase() || "";
  return m === "khqr" || m.includes("khqr");
}

function isPaywayMethod(method?: string) {
  const m = method?.toLowerCase() || "";
  return m.includes("aba") || m.includes("payway");
}

function pendingMessage(method: string) {
  if (method === "KHQR") {
    return "Your KHQR payment has not been confirmed yet. If you already paid, wait a moment and refresh, or check Orders.";
  }
  if (isPaywayMethod(method)) {
    return "Your ABA PayWay payment has not been confirmed yet. If you already paid, wait a moment and refresh, or check Orders.";
  }
  if (isStripeMethod(method)) {
    return "Your card payment is still being confirmed. Refresh this page in a few seconds.";
  }
  return "Your payment has not been confirmed yet. Refresh in a moment or check Orders.";
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const { user } = useAuth();
  const apiUrl = getApiUrl();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderState | null>(null);
  const [verificationFailed, setVerificationFailed] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    if (!user?.token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const authHeaders = {
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "application/json",
    };

    const fetchOrder = async () => {
      const res = await fetch(`${apiUrl}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) return null;
      return res.json();
    };

    const confirmStripeSession = async (current: OrderState) => {
      if (!sessionId || current.isPaid || !isStripeMethod(current.paymentMethod)) {
        return current;
      }

      const verifyRes = await fetch(`${apiUrl}/payments/stripe/verify-session`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ sessionId, orderId }),
      });

      if (!verifyRes.ok) return current;

      const verifyData = await verifyRes.json();
      if (verifyData.isPaid) {
        const refreshed = await fetchOrder();
        return refreshed || { ...current, isPaid: true };
      }

      return current;
    };

    const confirmQrPayment = async (current: OrderState) => {
      if (current.isPaid || !user?.token) return current;

      const result = await verifyPaymentStatus(orderId, user.token);
      if (result.paid) {
        const refreshed = await fetchOrder();
        return refreshed || { ...current, isPaid: true };
      }

      return current;
    };

    const verifyOrder = async () => {
      try {
        let data = await fetchOrder();
        if (!data) {
          if (!cancelled) setVerificationFailed(true);
          return;
        }

        data = await confirmStripeSession(data);
        if (!data.isPaid && (isKhqrMethod(data.paymentMethod) || isPaywayMethod(data.paymentMethod))) {
          data = await confirmQrPayment(data);
        }

        if (cancelled) return;

        setOrder(data);
        if (data.isPaid) {
          clearCart();
          setLoading(false);
          return;
        }

        let attempts = 0;
        pollTimer = setInterval(async () => {
          if (cancelled || attempts >= 15) {
            clearInterval(pollTimer);
            if (!cancelled) setLoading(false);
            return;
          }
          attempts += 1;

          let latest = await fetchOrder();
          if (!latest) return;

          latest = await confirmStripeSession(latest);
          if (!latest.isPaid && (isKhqrMethod(latest.paymentMethod) || isPaywayMethod(latest.paymentMethod))) {
            latest = await confirmQrPayment(latest);
          }

          if (cancelled) return;

          setOrder(latest);
          if (latest.isPaid) {
            clearCart();
            clearInterval(pollTimer);
            setLoading(false);
          }
        }, 2000);
      } catch (e) {
        console.error("Order verification failed", e);
        if (!cancelled) setVerificationFailed(true);
        setLoading(false);
      }
    };

    verifyOrder();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orderId, sessionId, user?.token, apiUrl, clearCart]);

  if (!orderId) {
    return (
      <PaymentStatusLayout
        icon={<AlertCircle className="size-16 text-destructive" />}
        title="Something went wrong"
        description="We could not find your order reference. Check your orders or return to the store."
        actions={
          <>
            <PaymentStatusLink href="/orders" variant="primary">
              View Orders
            </PaymentStatusLink>
            <PaymentStatusLink href="/">Continue Shopping</PaymentStatusLink>
          </>
        }
      />
    );
  }

  if (!user?.token) {
    const redirect = `/checkout/success?order_id=${orderId}${sessionId ? `&session_id=${sessionId}` : ""}`;
    return (
      <PaymentStatusLayout
        icon={<AlertCircle className="size-16 text-amber-500" />}
        title="Sign in required"
        description="Your payment may have completed. Sign in with the same account you used at checkout."
        actions={
          <PaymentStatusLink href={`/login?redirect=${encodeURIComponent(redirect)}`} variant="primary">
            Sign in
          </PaymentStatusLink>
        }
      />
    );
  }

  if (loading) {
    return <PageLoader label="Verifying your payment…" />;
  }

  if (verificationFailed || !order) {
    return (
      <PaymentStatusLayout
        icon={<AlertCircle className="size-16 text-destructive" />}
        title="Unable to verify payment"
        description="We could not load your order details. Try again or view your orders."
        actions={
          <>
            <PaymentStatusButton variant="primary" onClick={() => window.location.reload()}>
              Try again
            </PaymentStatusButton>
            <PaymentStatusLink href="/orders">View Orders</PaymentStatusLink>
          </>
        }
      />
    );
  }

  const displayId = order._id || orderId;

  if (!order.isPaid) {
    return (
      <PaymentStatusLayout
        icon={<Clock className="size-16 text-amber-500" />}
        title="Payment pending"
        description={pendingMessage(order.paymentMethod)}
        actions={
          <>
            <PaymentStatusButton variant="primary" onClick={() => window.location.reload()}>
              Refresh status
            </PaymentStatusButton>
            <PaymentStatusLink href="/orders">View Orders</PaymentStatusLink>
          </>
        }
      >
        <OrderInfoCard rows={[{ label: "Order Number", value: displayId }]} />
      </PaymentStatusLayout>
    );
  }

  return (
    <PaymentStatusLayout
      icon={<CheckCircle2 className="size-16 text-green-600" />}
      title="Payment successful"
      description="Thank you for your purchase. Your order is confirmed and being prepared."
      actions={
        <>
          <PaymentStatusLink href="/orders" variant="primary">
            View Orders
          </PaymentStatusLink>
          <PaymentStatusLink href="/">Continue Shopping</PaymentStatusLink>
        </>
      }
    >
      <OrderInfoCard
        rows={[
          { label: "Order Number", value: displayId },
          { label: "Payment", value: order.paymentMethod },
          {
            label: "Status",
            value: <span className="text-green-600">Paid</span>,
          },
        ]}
      />
    </PaymentStatusLayout>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <SuccessContent />
    </Suspense>
  );
}
