"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Package, ArrowLeft, Loader2, Clock, CheckCircle2, CreditCard, ChevronDown, Truck, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getApiUrl } from '@/lib/api';

type FilterType = 'all' | 'paid' | 'pending';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  paid: 'Payment confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

function buildTimeline(order: any) {
  if (order.timeline?.length) return order.timeline;
  const steps: { status: string; timestamp: string; note?: string }[] = [
    { status: 'pending', timestamp: order.createdAt, note: 'Order placed' },
  ];
  if (order.isPaid) {
    steps.push({ status: 'paid', timestamp: order.paidAt || order.createdAt, note: 'Payment confirmed' });
  }
  if (order.status && !['pending', 'paid'].includes(order.status)) {
    steps.push({ status: order.status, timestamp: order.updatedAt || order.createdAt });
  }
  if (order.isDelivered) {
    steps.push({ status: 'delivered', timestamp: order.deliveredAt || order.updatedAt, note: 'Delivered' });
  }
  return steps;
}

export default function OrdersPage() {
  const apiUrl = getApiUrl();
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState<FilterType>('all');
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
        // Sort by newest first
        setOrders(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'paid') return order.isPaid;
    if (filter === 'pending') return !order.isPaid;
    return true;
  });

  const pendingOrders = filteredOrders.filter(o => !o.isPaid);
  const isAllPendingSelected = pendingOrders.length > 0 && selectedOrderIds.length === pendingOrders.length;

  const handleSelectAll = () => {
    if (isAllPendingSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map(o => o._id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const selectedTotal = orders
    .filter(o => selectedOrderIds.includes(o._id))
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  const handleVerifyKhqrPayment = async (orderId: string) => {
    if (!user?.token) return;
    setVerifyingOrderId(orderId);
    try {
      const res = await fetch(`${apiUrl}/payments/khqr/check-status/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (res.ok && (data.isPaid || data.status === 'SUCCESS')) {
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

  if (!user || loading) {
    return (
      <div className="container mx-auto px-4 py-32 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl relative pb-32">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
        <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-muted/50 p-1 rounded-lg w-fit">
          <button 
            onClick={() => { setFilter('all'); setSelectedOrderIds([]); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All Orders
          </button>
          <button 
            onClick={() => { setFilter('pending'); setSelectedOrderIds([]); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => { setFilter('paid'); setSelectedOrderIds([]); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'paid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Paid
          </button>
        </div>

        {pendingOrders.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:text-foreground text-muted-foreground select-none">
            <input 
              type="checkbox" 
              checked={isAllPendingSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary accent-primary"
            />
            Select all pending ({pendingOrders.length})
          </label>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="border border-dashed rounded-2xl p-16 text-center bg-muted/20">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No {filter !== 'all' ? filter : ''} orders found</h2>
          <p className="text-muted-foreground mb-6">You don't have any matching orders.</p>
          <Link href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className={`border rounded-2xl overflow-hidden bg-card shadow-sm transition-all ${selectedOrderIds.includes(order._id) ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}`}>
              <div className="bg-muted/30 px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  {!order.isPaid && (
                    <input 
                      title="Select Order"
                      type="checkbox"
                      checked={selectedOrderIds.includes(order._id)}
                      onChange={() => toggleSelectOrder(order._id)}
                      className="w-5 h-5 rounded border-muted-foreground/30 text-primary focus:ring-primary accent-primary flex-shrink-0 cursor-pointer"
                    />
                  )}
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>
                      <span className="block text-muted-foreground mb-0.5">Order Placed</span>
                      <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground mb-0.5">Total</span>
                      <span className="font-medium">${order.totalPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground mb-0.5">Order Number</span>
                      <span className="font-mono text-xs font-medium">{order._id.slice(-8)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {order.isPaid ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Pending Payment
                    </span>
                  )}
                  {!order.isPaid && (
                    <Link
                      href={`/checkout?payOrder=${order._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay now
                    </Link>
                  )}
                  {!order.isPaid && order.paymentMethod === 'KHQR' && (
                    <button
                      onClick={() => handleVerifyKhqrPayment(order._id)}
                      disabled={verifyingOrderId === order._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {verifyingOrderId === order._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      Verify KHQR
                    </button>
                  )}
                  {order.isDelivered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 border-b bg-muted/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{order.status || (order.isPaid ? 'paid' : 'pending')}</span>
                  {order.trackingNumber && (
                    <span className="text-muted-foreground ml-2">
                      · Tracking: <span className="font-mono font-medium text-foreground">{order.trackingNumber}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {expandedOrderId === order._id ? 'Hide tracking' : 'Track order'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedOrderId === order._id ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {expandedOrderId === order._id && (
                <div className="px-6 py-5 border-b bg-background">
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Shipping address</p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress?.address}, {order.shippingAddress?.city} {order.shippingAddress?.postalCode}
                      </p>
                    </div>
                  </div>
                  <ol className="relative border-l border-border ml-2 space-y-6">
                    {buildTimeline(order).map((step: any, i: number) => (
                      <li key={`${step.status}-${i}`} className="ml-6">
                        <span className={`absolute -left-1.5 flex h-3 w-3 rounded-full ring-4 ring-background ${i === buildTimeline(order).length - 1 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <p className="text-sm font-medium capitalize">{STATUS_LABELS[step.status] || step.status}</p>
                        {step.note && <p className="text-xs text-muted-foreground">{step.note}</p>}
                        <time className="text-xs text-muted-foreground">
                          {step.timestamp ? new Date(step.timestamp).toLocaleString() : ''}
                        </time>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              <div className="p-6">
                <div className="space-y-4">
                  {order.orderItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-muted border overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-muted-foreground text-sm mt-0.5">Qty: {item.qty}</p>
                      </div>
                      <div className="font-semibold text-sm">
                        ${(item.price * item.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Bar for Multiple Selection */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-10 pointer-events-none">
          <div className="container mx-auto max-w-5xl flex justify-center">
            <div className="bg-background/80 backdrop-blur-md border shadow-xl rounded-full px-6 py-4 flex items-center gap-8 pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selected ({selectedOrderIds.length})</span>
                <span className="text-xl font-bold">${selectedTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handlePaySelected}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors"
              >
                <CreditCard className="w-5 h-5" /> Continue to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
