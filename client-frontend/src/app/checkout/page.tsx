"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, CreditCard, QrCode, Loader2, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductImage from "@/components/ui/ProductImage";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import Link from "next/link";
import { Suspense } from "react";
import { getApiUrl } from "@/lib/api";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buyNow") === "1";
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const apiUrl = getApiUrl();
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'khqr' | 'aba' | 'wing' | 'acleda' | 'cod' | 'wallet'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [khqrString, setKhqrString] = useState<string | null>(null);
  const [khqrMd5, setKhqrMd5] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [khqrWaiting, setKhqrWaiting] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  const [contactEmail, setContactEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  // Auto-fill user details from Auth Context
  useEffect(() => {
    if (isBuyNow) {
      try {
        const raw = sessionStorage.getItem("buyNow");
        if (raw) setBuyNowItem(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [isBuyNow]);

  const checkoutItems = useMemo(
    () => (buyNowItem ? [buyNowItem] : cartItems),
    [buyNowItem, cartItems]
  );
  const checkoutTotal = useMemo(
    () => (buyNowItem ? buyNowItem.price * buyNowItem.qty : cartTotal),
    [buyNowItem, cartTotal]
  );

  const finishCheckout = useCallback(() => {
    if (buyNowItem) sessionStorage.removeItem("buyNow");
    else clearCart();
  }, [buyNowItem, clearCart]);

  useEffect(() => {
    if (user && !contactEmail) {
      setContactEmail(user.email || '');
      if (user.name && !firstName) {
        const nameParts = user.name.split(' ');
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(' '));
      }
    }
  }, [user]);

  useEffect(() => {
    fetch(`${apiUrl}/store/shipping/methods`)
      .then((r) => (r.ok ? r.json() : []))
      .then((methods) => {
        setShippingMethods(methods);
        if (methods[0]?._id) setSelectedShippingId(methods[0]._id);
      })
      .catch(() => {});
  }, [apiUrl]);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${apiUrl}/customer/wallet`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setWalletBalance(d.balance || 0))
      .catch(() => {});
  }, [user, apiUrl]);

  useEffect(() => {
    if (!user && paymentMethod !== 'cod') {
      setPaymentMethod('cod');
    }
  }, [user, paymentMethod]);

  const subtotalAfterDiscount = Math.max(0, checkoutTotal - couponDiscount);
  const taxRate = 0.10;
  const taxes = subtotalAfterDiscount * taxRate;
  const shippingPrice = freeShipping ? 0 : shippingFee;
  const finalTotal = subtotalAfterDiscount + taxes + shippingPrice;

  useEffect(() => {
    if (!selectedShippingId || freeShipping) {
      setShippingFee(0);
      return;
    }
    fetch(`${apiUrl}/store/shipping/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methodId: selectedShippingId, orderTotal: subtotalAfterDiscount, weightKg: 1 }),
    })
      .then((r) => (r.ok ? r.json() : { fee: 0 }))
      .then((d) => setShippingFee(d.fee || 0))
      .catch(() => setShippingFee(0));
  }, [selectedShippingId, subtotalAfterDiscount, freeShipping, apiUrl]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/store/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, orderTotal: checkoutTotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.message || 'Invalid coupon');
      setCouponCode(data.code);
      setCouponDiscount(data.discount || 0);
      setFreeShipping(!!data.freeShipping);
      toast.success(`Coupon ${data.code} applied`);
    } catch (err: any) {
      toast.error(err.message || 'Coupon invalid');
    }
  };

  const buildOrderPayload = () => ({
    orderItems: checkoutItems,
    shippingAddress: {
      address,
      city,
      postalCode: zipCode,
      country: 'Cambodia',
    },
    itemsPrice: checkoutTotal,
    taxPrice: taxes,
    shippingPrice,
    totalPrice: finalTotal,
    couponCode: couponCode || undefined,
    discountAmount: couponDiscount,
    guestEmail: !user ? contactEmail : undefined,
    guestName: !user ? `${firstName} ${lastName}`.trim() : undefined,
  });

  const orderHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user?.token) h.Authorization = `Bearer ${user.token}`;
    return h;
  };

  // Poll Bakong for KHQR payment confirmation (single interval, stable deps)
  const khqrMd5Ref = useRef(khqrMd5);
  khqrMd5Ref.current = khqrMd5;

  const checkKhqrPaymentNow = useCallback(async (orderId: string, token: string) => {
    const md5Query = khqrMd5Ref.current ? `?md5=${encodeURIComponent(khqrMd5Ref.current)}` : '';
    const statusRes = await fetch(
      `${apiUrl}/payments/khqr/check-status/${orderId}${md5Query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData.isPaid || statusData.status === 'SUCCESS') {
        return true;
      }
    }

    const orderRes = await fetch(`${apiUrl}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (orderRes.ok) {
      const orderData = await orderRes.json();
      if (orderData?.isPaid) return true;
    }

    return false;
  }, [apiUrl]);

  useEffect(() => {
    if (!khqrString || !createdOrderId || !user?.token) {
      setKhqrWaiting(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;
    const orderId = createdOrderId;
    const token = user.token;

    setKhqrWaiting(true);

    const handlePaymentSuccess = () => {
      if (cancelled) return;
      cancelled = true;
      clearInterval(intervalId);
      setKhqrWaiting(false);
      toast.success("Payment successful! Your order is confirmed.");
      finishCheckout();
      router.push(`/checkout/success?order_id=${orderId}`);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const paid = await checkKhqrPaymentNow(orderId, token);
        if (paid) handlePaymentSuccess();
      } catch (error) {
        console.error("KHQR polling error", error);
      }
    };

    poll();
    intervalId = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [khqrString, createdOrderId, user?.token, checkKhqrPaymentNow, finishCheckout, router]);
  const handleAutoFillLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          if (data && data.address) {
            if (data.address.road || data.address.suburb) {
              setAddress(`${data.address.road || ''} ${data.address.suburb || ''}`.trim());
            }
            if (data.address.city || data.address.town || data.address.village) {
              setCity(data.address.city || data.address.town || data.address.village);
            }
            if (data.address.state) {
              setState(data.address.state);
            }
            if (data.address.postcode) {
              setZipCode(data.address.postcode);
            }
            toast.success("Location auto-filled successfully!");
          } else {
            toast.error("Could not determine address from location.");
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to fetch address data.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error("Unable to retrieve your location. Please allow location access.");
      }
    );
  };

  const handleSimulateKhqrPayment = async () => {
    if (!createdOrderId) return;

    try {
      const res = await fetch(`${apiUrl}/payments/webhook/KHQR`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createdOrderId,
          status: 'success',
          transactionId: 'khqr_sim_' + Date.now(),
        }),
      });

      if (!res.ok) {
        toast.error("Failed to simulate payment.");
        return;
      }

      toast.success("Mock payment confirmed.");
      finishCheckout();
      router.push(`/checkout/success?order_id=${createdOrderId}`);
    } catch (e) {
      console.error('Simulation failed', e);
      toast.error("Failed to simulate payment.");
    }
  };

  const renderPaymentDetails = () => {
    if (paymentMethod === 'stripe') {
      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
            <ShieldCheck className="w-5 h-5" />
            Secure Stripe Checkout
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You will be safely redirected to Stripe&apos;s hosted checkout page to enter your payment details after you click &quot;Place Order&quot;.
          </p>
        </div>
      );
    }

    if (paymentMethod === 'khqr') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
          {khqrString ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCode value={khqrString} size={180} />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold">Scan to pay with KHQR</p>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  Open your banking app (ABA, Bakong, ACLEDA, etc.) and scan this code to complete payment.
                </p>
                {khqrWaiting && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for payment confirmation...
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!createdOrderId || !user?.token) return;
                        try {
                          const paid = await checkKhqrPaymentNow(createdOrderId, user.token);
                          if (paid) {
                            toast.success("Payment confirmed!");
                            finishCheckout();
                            router.push(`/checkout/success?order_id=${createdOrderId}`);
                          } else {
                            toast.info("Payment not detected yet. Keep this page open after scanning.");
                          }
                        } catch {
                          toast.error("Failed to check payment status.");
                        }
                      }}
                      className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                    >
                      I already paid — check now
                    </button>
                  </div>
                )}
              </div>
              {isDev && (
                <button
                  type="button"
                  onClick={handleSimulateKhqrPayment}
                  className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  Dev only: simulate successful payment
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-lg">Generate KHQR Code</p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-2">
                Click &quot;Place Order&quot; below to generate your unique KHQR code for this order.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (paymentMethod === 'wallet') {
      return (
        <p className="text-sm text-muted-foreground">
          Your store credit balance of ${walletBalance.toFixed(2)} will be applied when you place the order.
        </p>
      );
    }

    if (paymentMethod === 'cod') {
      return (
        <div className="space-y-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Cash on Delivery
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pay when your order arrives. No online payment is required now.
          </p>
        </div>
      );
    }

    const gatewayLabel =
      paymentMethod === 'aba' ? 'ABA Pay' : paymentMethod === 'wing' ? 'Wing Bank' : 'ACLEDA';

    return (
      <div className="space-y-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="w-5 h-5 text-primary" />
          {gatewayLabel}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You will be redirected to {gatewayLabel} to complete your payment after you click &quot;Place Order&quot;.
        </p>
      </div>
    );
  };

  const getInputClass = (val: string) =>
    `w-full px-4 py-3 rounded-lg border bg-background outline-none transition-colors ${hasSubmitted && !val ? 'border-red-500 focus:border-red-500' : 'focus:border-foreground'}`;
  
  // Calculate taxes (e.g., 10%) — see subtotalAfterDiscount above

  const handlePlaceOrder = async () => {
    setHasSubmitted(true);

    if (!contactEmail || !firstName || !lastName || !address || !city || !state || !zipCode) {
      toast.error("Please fill out all contact and shipping information.");
      return;
    }

    if (!user && paymentMethod !== 'cod') {
      toast.error("Guest checkout supports Cash on Delivery only. Sign in for online payment.");
      return;
    }

    setIsProcessing(true);

    const orderData = buildOrderPayload();

    try {
      if (paymentMethod === 'wallet' && user?.token) {
        const createRes = await fetch(`${apiUrl}/orders`, {
          method: 'POST',
          headers: orderHeaders(),
          body: JSON.stringify({ ...orderData, paymentMethod: 'Wallet' }),
        });
        const created = await createRes.json();
        if (!created._id) throw new Error(created.message || 'Failed to create order');

        const payRes = await fetch(`${apiUrl}/store/wallet/pay/${created._id}`, {
          method: 'POST',
          headers: orderHeaders(),
        });
        const paid = await payRes.json();
        if (!payRes.ok) throw new Error(paid.message || 'Wallet payment failed');

        toast.success('Paid with wallet!');
        finishCheckout();
        router.push(`/checkout/success?order_id=${created._id}`);
        return;
      }

      if (paymentMethod === 'stripe') {
        const res = await fetch(`${apiUrl}/payments/stripe/create-checkout-session`, {
          method: 'POST',
          headers: orderHeaders(),
          body: JSON.stringify(orderData),
        });
        const data = await res.json();
        
        if (data.url) {
          // If prototype=true, it means Stripe failed to initialize (no key). 
          // We can just simulate success and clear cart here for UX flow.
          if (data.url.includes('prototype=true')) {
            try {
              await fetch(`${apiUrl}/payments/webhook/Stripe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderId, status: 'success', transactionId: 'stripe_sim_' + Date.now() })
              });
            } catch (e) {
              console.error('Simulation failed', e);
            }
            toast.success("Order placed successfully! (Stripe Prototype Mode)");
            finishCheckout();
            router.push(data.url);
          } else {
            // Redirect to real Stripe
            window.location.href = data.url;
          }
        } else {
          toast.error("Failed to initialize Stripe checkout.");
          setIsProcessing(false);
        }
      } else if (paymentMethod === 'khqr') {
        const res = await fetch(`${apiUrl}/payments/khqr/generate`, {
          method: 'POST',
          headers: orderHeaders(),
          body: JSON.stringify(orderData),
        });
        const data = await res.json();
        
        if (data.qrString) {
          setKhqrString(data.qrString);
          setKhqrMd5(data.md5 || null);
          setCreatedOrderId(data.orderId);
          setKhqrWaiting(true);
          setIsProcessing(false);
          toast.success("KHQR generated. Scan the code to pay.");
        } else {
          toast.error(data.message || data.error?.message || "Failed to generate KHQR.");
          setIsProcessing(false);
        }
      } else if (['aba', 'wing', 'acleda'].includes(paymentMethod)) {
        // Generic Mock Gateway
        let gatewayStr = paymentMethod === 'aba' ? 'ABA Pay' : paymentMethod === 'wing' ? 'Wing' : 'ACLEDA';
        const res = await fetch(`${apiUrl}/payments/mock/generate`, {
          method: 'POST',
          headers: orderHeaders(),
          body: JSON.stringify({ ...orderData, gateway: gatewayStr }),
        });
        const data = await res.json();
        
        if (data.url) {
          toast.success(`Redirecting to ${gatewayStr}...`);
          window.location.href = data.url;
        } else {
          toast.error(`Failed to initialize ${gatewayStr}.`);
          setIsProcessing(false);
        }
      } else if (paymentMethod === 'cod') {
        // Direct order creation
        const payload = { ...orderData, paymentMethod: 'Cash on Delivery' };
        const res = await fetch(`${apiUrl}/orders`, {
          method: 'POST',
          headers: orderHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        
        if (data._id) {
          toast.success("Order placed successfully (Cash on Delivery)!");
          finishCheckout();
          router.push(`/checkout/success?order_id=${data._id}`);
        } else {
          toast.error("Failed to place order.");
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-8 text-muted-foreground">
        <ShieldCheck className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium">Secure Checkout</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Forms */}
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            {!user && (
              <p className="text-sm text-muted-foreground mb-3 rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
                Checking out as guest — online payments require an account. Cash on Delivery is available.
              </p>
            )}
            <div className="space-y-4">
              <input type="email" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={getInputClass(contactEmail)} />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Shipping Address</h2>
              <button 
                type="button"
                onClick={handleAutoFillLocation}
                disabled={isLocating}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {isLocating ? 'Locating...' : 'Use Current Location'}
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={getInputClass(firstName)} />
                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={getInputClass(lastName)} />
              </div>
              <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className={getInputClass(address)} />
              <div className="grid grid-cols-3 gap-4">
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={getInputClass(city)} />
                <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className={getInputClass(state)} />
                <input type="text" placeholder="ZIP Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={getInputClass(zipCode)} />
              </div>
            </div>
          </section>

          {shippingMethods.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
              <div className="space-y-2">
                {shippingMethods.map((m) => (
                  <label
                    key={m._id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedShippingId === m._id ? 'border-foreground bg-background' : 'border-border/60 hover:border-border'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShippingId === m._id}
                        onChange={() => setSelectedShippingId(m._id)}
                        className="accent-foreground"
                      />
                      <div>
                        <span className="font-medium">{m.name}</span>
                        {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                      </div>
                    </div>
                    <span className="font-medium text-sm">
                      {freeShipping ? 'Free' : m.type === 'free' ? 'Free' : 'Calculated'}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold mb-4">Coupon Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl border bg-background"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="px-5 py-2.5 rounded-xl bg-foreground text-background font-medium text-sm hover:bg-foreground/90"
              >
                Apply
              </button>
            </div>
            {couponCode && (
              <p className="text-sm text-green-600 mt-2">
                {couponCode} applied — ${couponDiscount.toFixed(2)} off
                {freeShipping ? ' + free shipping' : ''}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setPaymentMethod('stripe')}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'stripe' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                {/* Real Stripe Logo */}
                <div className="h-7 mb-1 flex items-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                    alt="Stripe Logo" 
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'stripe' ? 'text-foreground' : 'text-muted-foreground'}`}>Credit Card</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'stripe' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>Visa, Mastercard, Amex, Apple Pay</span>
                </div>
                
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'stripe' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'stripe' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>


              <button 
                onClick={() => setPaymentMethod('aba')}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'aba' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                <div className="h-7 mb-1 flex items-center">
                  <span className="font-bold text-blue-600 text-lg tracking-wider">ABA Pay</span>
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'aba' ? 'text-foreground' : 'text-muted-foreground'}`}>ABA Pay</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'aba' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>Secure payment via ABA</span>
                </div>
                
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'aba' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'aba' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('wing')}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'wing' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                <div className="h-7 mb-1 flex items-center">
                  <span className="font-bold text-green-500 text-lg tracking-wider">Wing</span>
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'wing' ? 'text-foreground' : 'text-muted-foreground'}`}>Wing Bank</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'wing' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>Pay with Wing app</span>
                </div>
                
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'wing' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'wing' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('acleda')}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'acleda' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                <div className="h-7 mb-1 flex items-center">
                  <span className="font-bold text-yellow-600 text-lg tracking-wider">ACLEDA</span>
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'acleda' ? 'text-foreground' : 'text-muted-foreground'}`}>ACLEDA ToanChet</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'acleda' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>Pay via ACLEDA app</span>
                </div>
                
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'acleda' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'acleda' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('cod')}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'cod' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                <div className="h-7 mb-1 flex items-center">
                  <ShieldCheck className="text-foreground w-6 h-6" />
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'cod' ? 'text-foreground' : 'text-muted-foreground'}`}>Cash on Delivery</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'cod' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>Pay when you receive it</span>
                </div>
                
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'cod' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>
              <button 
                onClick={() => setPaymentMethod('khqr')}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'khqr' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                {/* Real KHQR Logo */}
                <div className="h-7 mb-1 flex items-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/b/bb/KHQR_Logo.png" 
                    alt="KHQR Logo" 
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'khqr' ? 'text-foreground' : 'text-muted-foreground'}`}>KHQR Scan</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'khqr' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>ABA, Bakong, Acleda, Canadia</span>
                </div>

                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'khqr' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'khqr' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>
              {user && walletBalance > 0 && (
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'wallet' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
                >
                  <div className="h-7 mb-1 flex items-center">
                    <span className="font-bold text-purple-600 text-lg">Wallet</span>
                  </div>
                  <div>
                    <span className={`block font-semibold ${paymentMethod === 'wallet' ? 'text-foreground' : 'text-muted-foreground'}`}>Store Credit</span>
                    <span className={`text-xs mt-1 block ${paymentMethod === 'wallet' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      Balance: ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'wallet' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                    {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                  </div>
                </button>
              )}
            </div>

            {/* Dynamic Payment Details UI */}
            <div className="border rounded-2xl p-6 bg-muted/20">
              {renderPaymentDetails()}
            </div>
          </section>
        </div>

        {/* Order Summary Checkout */}
        <div>
          <div className="bg-muted/30 border rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Your Order</h2>
            
            <div className="space-y-4 mb-6 border-b pb-6">
              {checkoutItems.map((item) => (
                <div key={item._id} className="flex gap-4 items-center">
                  <div className="relative shrink-0 pt-2 pr-2">
                    <div className="w-16 h-16 bg-muted border rounded-xl overflow-hidden relative">
                      <ProductImage src={item.image} alt={item.name} fill className="object-cover mix-blend-multiply" />
                    </div>
                    <span className="absolute top-0 right-0 bg-foreground text-background w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-20 shadow-md ring-2 ring-background">{item.qty}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                  </div>
                  <div className="font-medium text-sm">${(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm mb-6 border-b pb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${checkoutTotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({couponCode})</span>
                  <span className="font-medium">-${couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {freeShipping || shippingPrice === 0 ? 'Free' : `$${shippingPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes</span>
                <span className="font-medium">${taxes.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold">${finalTotal.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={isProcessing || checkoutItems.length === 0 || (paymentMethod === 'khqr' && !!khqrString)}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-medium h-12 rounded-full hover:bg-foreground/90 transition-all active:scale-95 shadow-lg shadow-foreground/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === 'khqr' && khqrString ? (
                "Waiting for KHQR payment..."
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
