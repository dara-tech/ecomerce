"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Clock,
  CheckCircle2,
  CreditCard,
  ChevronDown,
  Truck,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { PageLoader, InlineLoader } from "@/components/ui/PageLoader";
import PriceDisplay from "@/components/features/PriceDisplay";
import ProductImage from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";

type FilterType = "all" | "paid" | "pending";

const STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  paid: "Payment confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

function buildTimeline(order: any) {
  if (order.timeline?.length) return order.timeline;
  const steps: { status: string; timestamp: string; note?: string }[] = [
    { status: "pending", timestamp: order.createdAt, note: "Order placed" },
  ];
  if (order.isPaid) {
    steps.push({
      status: "paid",
      timestamp: order.paidAt || order.createdAt,
      note: "Payment confirmed",
    });
  }
  if (order.status && !["pending", "paid"].includes(order.status)) {
    steps.push({ status: order.status, timestamp: order.updatedAt || order.createdAt });
  }
  if (order.isDelivered) {
    steps.push({
      status: "delivered",
      timestamp: order.deliveredAt || order.updatedAt,
      note: "Delivered",
    });
  }
  return steps;
}

export default function OrdersPage() {
  const apiUrl = getApiUrl();
  const { user } = useAuth();
  const { t } = useStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) {
      const storedUser = localStorage.getItem("userInfo");
      if (!storedUser) {
        router.push("/login");
      }
    }
  }, [user, router]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(
          data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (filter === "paid") return order.isPaid;
    if (filter === "pending") return !order.isPaid;
    return true;
  });

  const pendingOrders = filteredOrders.filter((o) => !o.isPaid);
  const isAllPendingSelected =
    pendingOrders.length > 0 && selectedOrderIds.length === pendingOrders.length;

  const handleSelectAll = () => {
    if (isAllPendingSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map((o) => o._id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((orderId) => orderId !== id) : [...prev, id]
    );
  };

  const selectedTotal = orders
    .filter((o) => selectedOrderIds.includes(o._id))
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  const handleVerifyKhqrPayment = async (orderId: string) => {
    if (!user?.token) return;
    setVerifyingOrderId(orderId);
    try {
      const res = await fetch(`${apiUrl}/payments/khqr/check-status/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (res.ok && (data.isPaid || data.status === "SUCCESS")) {
        toast.success("KHQR payment confirmed!");
        await fetchOrders();
      } else {
        toast.info(data.message || "Payment not found yet. Try again in a moment.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to verify payment");
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handlePaySelected = () => {
    if (selectedOrderIds.length === 0) return;
    if (selectedOrderIds.length > 1) {
      toast.info("Please complete payment for one order at a time.");
      return;
    }
    router.push(`/checkout?payOrder=${selectedOrderIds[0]}`);
  };

  const showSelectionDock = selectedOrderIds.length > 0;

  if (!user || loading) {
    return <PageLoader label="Loading orders…" />;
  }

  const filterBtn = (value: FilterType, label: string) => (
    <button
      type="button"
      onClick={() => {
        setFilter(value);
        setSelectedOrderIds([]);
      }}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
        filter === value
          ? "bg-foreground text-background"
          : "bg-muted/60 text-muted-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        "container mx-auto max-w-5xl px-4 pt-4 md:py-16",
        showSelectionDock
          ? "pb-[calc(var(--mobile-tab-bar-h)+5.25rem)]"
          : "pb-[var(--mobile-tab-bar-h)] md:pb-16"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3 md:mb-8">
        <h1 className="text-xl font-bold tracking-tight md:text-3xl">{t("orderHistory")}</h1>
        <Link
          href="/profile"
          className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:text-sm"
        >
          <ArrowLeft className="size-3.5 md:size-4" />
          <span className="hidden sm:inline">{t("backToProfile")}</span>
          <span className="sm:hidden">{t("account")}</span>
        </Link>
      </div>

      <div className="mb-4 space-y-3 md:mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {filterBtn("all", t("allOrders"))}
          {filterBtn("pending", t("pending"))}
          {filterBtn("paid", t("paid"))}
        </div>

        {pendingOrders.length > 0 && (
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={isAllPendingSelected}
              onChange={handleSelectAll}
              className="size-4 accent-foreground"
            />
            {t("selectAllPending").replace("{count}", String(pendingOrders.length))}
          </label>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
          <Package className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
          <h2 className="mb-2 text-lg font-semibold md:text-xl">{t("noOrdersFound")}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{t("noMatchingOrders")}</p>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform active:scale-[0.98] hover:bg-foreground/90"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-6">
          {filteredOrders.map((order) => (
            <article
              key={order._id}
              className={cn(
                "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all",
                selectedOrderIds.includes(order._id) && "ring-2 ring-foreground"
              )}
            >
              <div className="border-b border-border/60 bg-muted/20 p-3 md:p-4">
                <div className="flex items-start gap-3">
                  {!order.isPaid && (
                    <input
                      title="Select order"
                      type="checkbox"
                      checked={selectedOrderIds.includes(order._id)}
                      onChange={() => toggleSelectOrder(order._id)}
                      className="mt-1 size-4 shrink-0 accent-foreground"
                    />
                  )}
                  <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-xs md:gap-4 md:text-sm">
                    <div>
                      <span className="mb-0.5 block text-[10px] text-muted-foreground md:text-xs">
                        {t("orderPlaced")}
                      </span>
                      <span className="font-medium tabular-nums">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="mb-0.5 block text-[10px] text-muted-foreground md:text-xs">
                        {t("total")}
                      </span>
                      <span className="font-semibold tabular-nums">
                        <PriceDisplay amount={order.totalPrice} />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="mb-0.5 block text-[10px] text-muted-foreground md:text-xs">
                        {t("orderNumber")}
                      </span>
                      <span className="font-mono text-[11px] font-medium md:text-xs">
                        {order._id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.isPaid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                      <CheckCircle2 className="size-3" /> {t("paid")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                      <Clock className="size-3" /> {t("pendingPayment")}
                    </span>
                  )}
                  {!order.isPaid && (
                    <Link
                      href={`/checkout?payOrder=${order._id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-foreground px-3 text-[11px] font-semibold text-background transition-transform active:scale-[0.98]"
                    >
                      <CreditCard className="size-3" />
                      {t("payNow")}
                    </Link>
                  )}
                  {!order.isPaid && order.paymentMethod === "KHQR" && (
                    <button
                      type="button"
                      onClick={() => handleVerifyKhqrPayment(order._id)}
                      disabled={verifyingOrderId === order._id}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-border/60 bg-background px-3 text-[11px] font-semibold disabled:opacity-50"
                    >
                      {verifyingOrderId === order._id ? (
                        <InlineLoader size="xs" />
                      ) : (
                        <CreditCard className="size-3" />
                      )}
                      {t("verifyKhqr")}
                    </button>
                  )}
                  {order.isDelivered && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                      <CheckCircle2 className="size-3" /> {t("delivered")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/10 px-3 py-2.5 md:px-4 md:py-3">
                <div className="flex min-w-0 items-center gap-2 text-xs md:text-sm">
                  <Truck className="size-3.5 shrink-0 text-muted-foreground md:size-4" />
                  <span className="text-muted-foreground">{t("status")}:</span>
                  <span className="truncate font-medium capitalize">
                    {order.status || (order.isPaid ? "paid" : "pending")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOrderId(expandedOrderId === order._id ? null : order._id)
                  }
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground md:text-sm"
                >
                  {expandedOrderId === order._id ? t("hideTracking") : t("trackOrder")}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform md:size-4",
                      expandedOrderId === order._id && "rotate-180"
                    )}
                  />
                </button>
              </div>

              {expandedOrderId === order._id && (
                <div className="border-b border-border/60 bg-background px-3 py-4 md:px-6 md:py-5">
                  <div className="mb-4 flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">{t("shippingAddress")}</p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress?.address}, {order.shippingAddress?.city}{" "}
                        {order.shippingAddress?.postalCode}
                      </p>
                      {order.trackingNumber && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tracking:{" "}
                          <span className="font-mono font-medium text-foreground">
                            {order.trackingNumber}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <ol className="relative ml-2 space-y-5 border-l border-border">
                    {buildTimeline(order).map((step: any, i: number) => (
                      <li key={`${step.status}-${i}`} className="ml-6">
                        <span
                          className={cn(
                            "absolute -left-1.5 flex size-3 rounded-full ring-4 ring-background",
                            i === buildTimeline(order).length - 1
                              ? "bg-foreground"
                              : "bg-muted-foreground/40"
                          )}
                        />
                        <p className="text-sm font-medium capitalize">
                          {STATUS_LABELS[step.status] || step.status}
                        </p>
                        {step.note && (
                          <p className="text-xs text-muted-foreground">{step.note}</p>
                        )}
                        <time className="text-xs text-muted-foreground">
                          {step.timestamp ? new Date(step.timestamp).toLocaleString() : ""}
                        </time>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="space-y-3 p-3 md:p-6">
                {order.orderItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-stretch gap-3">
                    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted md:h-16 md:w-16">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        fill
                        compactPlaceholder
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      <div>
                        <h4 className="line-clamp-2 text-sm font-medium leading-snug">
                          {item.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("qty")}: {item.qty}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 self-end text-sm font-semibold tabular-nums">
                      <PriceDisplay amount={item.price * item.qty} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {showSelectionDock && (
        <div className="mobile-dock-above-tabs md:hidden">
          <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("selectedCount").replace("{count}", String(selectedOrderIds.length))}
              </p>
              <p className="text-lg font-bold tabular-nums">
                <PriceDisplay amount={selectedTotal} />
              </p>
            </div>
            <button
              type="button"
              onClick={handlePaySelected}
              className="inline-flex h-11 max-w-[11rem] flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98]"
            >
              <CreditCard className="size-4 shrink-0" />
              {t("payNow")}
            </button>
          </div>
        </div>
      )}

      {showSelectionDock && (
        <div className="fixed inset-x-0 bottom-0 z-40 hidden justify-center p-4 md:flex">
          <div className="flex items-center gap-8 rounded-full border border-border/60 bg-background px-6 py-4 shadow-xl">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("selectedCount").replace("{count}", String(selectedOrderIds.length))}
              </span>
              <span className="text-xl font-bold tabular-nums">
                <PriceDisplay amount={selectedTotal} />
              </span>
            </div>
            <button
              type="button"
              onClick={handlePaySelected}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-3 font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              <CreditCard className="size-5" />
              {t("continueToCheckout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
