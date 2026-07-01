"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, ArrowLeft, Clock, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";

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

    const confirmKhqr = async (current: OrderState) => {
      if (current.isPaid || current.paymentMethod !== "KHQR") return current;

      const khqrRes = await fetch(`${apiUrl}/payments/khqr/check-status/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!khqrRes.ok) return current;

      const khqrData = await khqrRes.json();
      if (khqrData.isPaid || khqrData.status === "SUCCESS") {
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
        data = await confirmKhqr(data);

        if (cancelled) return;

        setOrder(data);
        if (data.isPaid) {
          clearCart();
          setLoading(false);
          return;
        }

        // Keep polling briefly — webhook or Bakong may lag behind redirect
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
          latest = await confirmKhqr(latest);

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
      <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold mb-3">Missing order reference</h1>
        <Link href="/orders" className="text-primary underline font-medium">
          View My Orders
        </Link>
      </div>
    );
  }

  if (!user?.token) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-2xl font-bold mb-3">Sign in to view your order</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your payment may have completed. Sign in with the same account used at checkout.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/checkout/success?order_id=${orderId}${sessionId ? `&session_id=${sessionId}` : ""}`)}`}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }

  if (verificationFailed || !order) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold mb-3">Unable to verify order</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We could not load your order details. Please check your orders page or contact support.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          View My Orders
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isPaid = order.isPaid;

  if (!isPaid) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center text-center">
        <Clock className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-2xl font-bold mb-3">Payment pending</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          {order.paymentMethod === "KHQR"
            ? "Your KHQR payment has not been confirmed yet. If you already paid, wait a moment and refresh, or check Orders."
            : "Your Stripe payment is still being confirmed. Refresh this page in a few seconds."}
        </p>
        <div className="w-full max-w-md bg-muted/30 border rounded-2xl p-6 mb-8 text-left">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-medium">{orderId}</span>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/orders"
            className="flex-1 inline-flex justify-center items-center gap-2 h-12 px-6 rounded-full border border-border bg-background font-semibold hover:bg-muted transition-colors"
          >
            View Orders
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex justify-center items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Refresh status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
        <CheckCircle2 className="w-24 h-24 text-green-500 relative z-10" />
      </div>

      <h1 className="text-4xl font-black mb-4">Payment Successful!</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        Thank you for your purchase. Your order has been securely processed and is now being prepared for shipping.
      </p>

      <div className="w-full max-w-md bg-muted/30 border rounded-2xl p-6 mb-10 text-left">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" /> Order Details
        </h3>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-medium text-foreground">{orderId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <span className="text-muted-foreground">Status</span>
            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
              Paid
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-muted-foreground">Estimated Delivery</span>
            <span className="font-medium text-foreground">3-5 Business Days</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/"
          className="flex-1 inline-flex justify-center items-center gap-2 h-12 px-6 rounded-full border border-border bg-background font-semibold hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
        <Link
          href="/orders"
          className="flex-1 inline-flex justify-center items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          View Order Status
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
