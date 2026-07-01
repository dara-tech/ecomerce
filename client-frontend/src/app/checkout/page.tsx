"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, QrCode, Loader2, MapPin } from "lucide-react";
import { useCart, type CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductImage from "@/components/ui/ProductImage";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import Link from "next/link";
import { Suspense } from "react";
import { getApiUrl } from "@/lib/api";
import { validateCartItems, formatRemovedCartMessage } from "@/lib/cartValidation";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buyNow") === "1";
  const payOrderId = searchParams.get("payOrder");
  const { cartItems, cartTotal, clearCart, syncCart } = useCart();
  const { user } = useAuth();
  const apiUrl = getApiUrl();
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [loadingPendingOrder, setLoadingPendingOrder] = useState(!!payOrderId);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "khqr" | "payway">("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [khqrString, setKhqrString] = useState<string | null>(null);
  const [khqrMd5, setKhqrMd5] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [khqrWaiting, setKhqrWaiting] = useState(false);
  const [khqrProviderIssue, setKhqrProviderIssue] = useState(false);
  const [paywayQrString, setPaywayQrString] = useState<string | null>(null);
  const [paywayQrImage, setPaywayQrImage] = useState<string | null>(null);
  const [paywayWaiting, setPaywayWaiting] = useState(false);
  const [paywayProviderIssue, setPaywayProviderIssue] = useState(false);

  const [contactEmail, setContactEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
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

  useEffect(() => {
    if (payOrderId && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/checkout?payOrder=${payOrderId}`)}`);
    }
  }, [payOrderId, user, router]);

  useEffect(() => {
    if (user || payOrderId) return;
    const redirect = isBuyNow ? "/checkout?buyNow=1" : "/checkout";
    router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
  }, [user, payOrderId, isBuyNow, router]);

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

  useEffect(() => {
    if (!payOrderId) {
      setPendingOrder(null);
      setLoadingPendingOrder(false);
      return;
    }
    if (!user?.token) {
      setLoadingPendingOrder(false);
      return;
    }

    let cancelled = false;
    setLoadingPendingOrder(true);

    fetch(`${apiUrl}/orders/${payOrderId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((order) => {
        if (cancelled) return;
        if (order.isPaid) {
          toast.info("This order is already paid.");
          router.replace(`/checkout/success?order_id=${order._id}`);
          return;
        }
        setPendingOrder(order);
        setCreatedOrderId(order._id);
        setContactEmail(order.user?.email || user.email || "");
        const guestName = order.guestName || "";
        const nameParts = guestName.split(" ").filter(Boolean);
        if (order.shippingAddress) {
          setAddress(order.shippingAddress.address || "");
          setCity(order.shippingAddress.city || "");
          setZipCode(order.shippingAddress.postalCode || "");
        }
        if (nameParts.length) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(" "));
        }
        const method = String(order.paymentMethod || "").toLowerCase();
        if (method.includes("khqr")) setPaymentMethod("khqr");
        else if (method.includes("aba") || method.includes("payway")) setPaymentMethod("payway");
        else setPaymentMethod("stripe");
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load order for payment.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPendingOrder(false);
      });

    return () => {
      cancelled = true;
    };
  }, [payOrderId, user, apiUrl, router]);

  const isPayExistingOrder = !!pendingOrder;
  const existingOrderId = pendingOrder?._id ?? null;

  const checkoutItems = useMemo(
    () =>
      pendingOrder
        ? pendingOrder.orderItems.map((item: any) => ({
            _id: item.product || item._id,
            name: item.name,
            image: item.image,
            price: item.price,
            qty: item.qty,
          }))
        : buyNowItem
          ? [buyNowItem]
          : cartItems,
    [pendingOrder, buyNowItem, cartItems]
  );
  const checkoutTotal = useMemo(
    () =>
      pendingOrder
        ? pendingOrder.itemsPrice
        : buyNowItem
          ? buyNowItem.price * buyNowItem.qty
          : cartTotal,
    [pendingOrder, buyNowItem, cartTotal]
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

  const subtotalAfterDiscount = isPayExistingOrder
    ? checkoutTotal
    : Math.max(0, checkoutTotal - couponDiscount);
  const taxRate = 0.10;
  const taxes = isPayExistingOrder ? pendingOrder?.taxPrice ?? 0 : subtotalAfterDiscount * taxRate;
  const shippingPrice = isPayExistingOrder
    ? pendingOrder?.shippingPrice ?? 0
    : freeShipping
      ? 0
      : shippingFee;
  const finalTotal = isPayExistingOrder
    ? pendingOrder?.totalPrice ?? checkoutTotal
    : subtotalAfterDiscount + taxes + shippingPrice;

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

  const mapOrderItems = (items: CartItem[]) =>
    items.map((item) => ({
      product: item._id,
      _id: item._id,
      name: item.name,
      image: item.image,
      price: item.price,
      qty: item.qty,
    }));

  const buildOrderPayload = (items: CartItem[]) => {
    const itemsPrice = isPayExistingOrder
      ? checkoutTotal
      : items.reduce((acc, item) => acc + item.price * item.qty, 0);
    const subtotal = isPayExistingOrder
      ? checkoutTotal
      : Math.max(0, itemsPrice - couponDiscount);
    const orderTaxes = isPayExistingOrder ? pendingOrder?.taxPrice ?? 0 : subtotal * taxRate;
    const orderShipping = isPayExistingOrder
      ? pendingOrder?.shippingPrice ?? 0
      : freeShipping
        ? 0
        : shippingFee;
    const orderTotal = isPayExistingOrder
      ? pendingOrder?.totalPrice ?? checkoutTotal
      : subtotal + orderTaxes + orderShipping;

    return {
      ...(existingOrderId ? { existingOrderId } : {}),
      orderItems: mapOrderItems(items),
      shippingAddress: {
        address,
        city,
        postalCode: zipCode,
        country: "Cambodia",
      },
      itemsPrice,
      taxPrice: orderTaxes,
      shippingPrice: orderShipping,
      totalPrice: orderTotal,
      couponCode: couponCode || undefined,
      discountAmount: couponDiscount,
      guestEmail: !user ? contactEmail : undefined,
      guestName: !user ? `${firstName} ${lastName}`.trim() : undefined,
    };
  };

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const statusRes = await fetch(
        `${apiUrl}/payments/khqr/check-status/${orderId}${md5Query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.isPaid || statusData.status === 'SUCCESS') {
          return { paid: true as const };
        }
        return {
          paid: false as const,
          providerUnavailable: Boolean(statusData.providerUnavailable),
        };
      }

      if (statusRes.status === 401) {
        return { paid: false as const, authExpired: true as const };
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const orderRes = await fetch(`${apiUrl}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (orderRes.ok) {
      const orderData = await orderRes.json();
      if (orderData?.isPaid) return { paid: true as const };
    }

    return { paid: false as const };
  }, [apiUrl]);

  const checkPaywayPaymentNow = useCallback(async (orderId: string, token: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const statusRes = await fetch(`${apiUrl}/payments/payway/check-status/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.isPaid || statusData.status === 'SUCCESS') {
          return { paid: true as const };
        }
        return {
          paid: false as const,
          providerUnavailable: Boolean(statusData.providerUnavailable),
        };
      }

      if (statusRes.status === 401) {
        return { paid: false as const, authExpired: true as const };
      }
    } finally {
      clearTimeout(timeoutId);
    }

    return { paid: false as const };
  }, [apiUrl]);

  useEffect(() => {
    if (!khqrString || !createdOrderId || !user?.token) {
      setKhqrWaiting(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;
    let pollDelayMs = 4000;
    let errorStreak = 0;
    const orderId = createdOrderId;
    const token = user.token;

    setKhqrWaiting(true);
    setKhqrProviderIssue(false);

    const handlePaymentSuccess = () => {
      if (cancelled) return;
      cancelled = true;
      clearInterval(intervalId);
      setKhqrWaiting(false);
      toast.success("Payment successful! Your order is confirmed.");
      finishCheckout();
      router.push(`/checkout/success?order_id=${orderId}`);
    };

    const scheduleNextPoll = () => {
      clearInterval(intervalId);
      intervalId = setInterval(poll, pollDelayMs);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await checkKhqrPaymentNow(orderId, token);
        errorStreak = 0;
        pollDelayMs = 4000;

        if (result.paid) {
          handlePaymentSuccess();
          return;
        }

        if (result.authExpired) {
          toast.error("Session expired. Please sign in again.");
          return;
        }

        if (result.providerUnavailable) {
          setKhqrProviderIssue(true);
        }
      } catch {
        errorStreak += 1;
        if (errorStreak >= 3) {
          pollDelayMs = Math.min(pollDelayMs * 2, 15000);
          scheduleNextPoll();
        }
      }
    };

    poll();
    intervalId = setInterval(poll, pollDelayMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [khqrString, createdOrderId, user?.token, checkKhqrPaymentNow, finishCheckout, router]);

  useEffect(() => {
    if ((!paywayQrString && !paywayQrImage) || !createdOrderId || !user?.token) {
      setPaywayWaiting(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;
    let pollDelayMs = 4000;
    let errorStreak = 0;
    const orderId = createdOrderId;
    const token = user.token;

    setPaywayWaiting(true);
    setPaywayProviderIssue(false);

    const handlePaymentSuccess = () => {
      if (cancelled) return;
      cancelled = true;
      clearInterval(intervalId);
      setPaywayWaiting(false);
      toast.success("Payment successful! Your order is confirmed.");
      finishCheckout();
      router.push(`/checkout/success?order_id=${orderId}`);
    };

    const scheduleNextPoll = () => {
      clearInterval(intervalId);
      intervalId = setInterval(poll, pollDelayMs);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await checkPaywayPaymentNow(orderId, token);
        errorStreak = 0;
        pollDelayMs = 4000;

        if (result.paid) {
          handlePaymentSuccess();
          return;
        }

        if (result.authExpired) {
          toast.error("Session expired. Please sign in again.");
          return;
        }

        if (result.providerUnavailable) {
          setPaywayProviderIssue(true);
        }
      } catch {
        errorStreak += 1;
        if (errorStreak >= 3) {
          pollDelayMs = Math.min(pollDelayMs * 2, 15000);
          scheduleNextPoll();
        }
      }
    };

    poll();
    intervalId = setInterval(poll, pollDelayMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [paywayQrString, paywayQrImage, createdOrderId, user?.token, checkPaywayPaymentNow, finishCheckout, router]);

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

  const renderPaymentDetails = () => {
    if (paymentMethod === "stripe") {
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

    if (paymentMethod === "payway") {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
          {paywayQrString || paywayQrImage ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                {paywayQrImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={paywayQrImage} alt="ABA PayWay KHQR" className="w-[180px] h-[180px] object-contain" />
                ) : paywayQrString ? (
                  <QRCode value={paywayQrString} size={180} />
                ) : null}
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold">Scan with ABA / KHQR app</p>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  PayWay ABA KHQR — open ABA Mobile or any KHQR banking app and scan to pay.
                </p>
                {paywayWaiting && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for payment confirmation...
                    </div>
                    {paywayProviderIssue && (
                      <p className="text-xs text-amber-600 max-w-[280px]">
                        Auto-confirm may be delayed. If you already paid, check status below.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!createdOrderId || !user?.token) return;
                        try {
                          const result = await checkPaywayPaymentNow(createdOrderId, user.token);
                          if (result.paid) {
                            toast.success("Payment confirmed!");
                            finishCheckout();
                            router.push(`/checkout/success?order_id=${createdOrderId}`);
                          } else {
                            toast.info("Payment not detected yet.");
                          }
                        } catch {
                          toast.error("Network error. Try again.");
                        }
                      }}
                      className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                    >
                      I already paid — check now
                    </button>
                    <Link
                      href={`/checkout/success?order_id=${createdOrderId}`}
                      className="text-xs font-semibold text-primary underline hover:opacity-80"
                    >
                      View order status
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-lg">Generate ABA KHQR</p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-2">
                Click &quot;Place Order&quot; to generate a PayWay KHQR code for this order.
              </p>
            </div>
          )}
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
                    {khqrProviderIssue && (
                      <p className="text-xs text-amber-600 max-w-[280px]">
                        Auto-confirm may be delayed. If you already paid, open order status below.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!createdOrderId || !user?.token) return;
                        try {
                          const result = await checkKhqrPaymentNow(createdOrderId, user.token);
                          if (result.paid) {
                            toast.success("Payment confirmed!");
                            finishCheckout();
                            router.push(`/checkout/success?order_id=${createdOrderId}`);
                          } else {
                            toast.info("Payment not detected yet. You can still open order status if you already paid.");
                          }
                        } catch {
                          toast.error("Network error. Try again or open order status.");
                        }
                      }}
                      className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                    >
                      I already paid — check now
                    </button>
                    <Link
                      href={`/checkout/success?order_id=${createdOrderId}`}
                      className="text-xs font-semibold text-primary underline hover:opacity-80"
                    >
                      View order status
                    </Link>
                  </div>
                )}
              </div>
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

    return null;
  };

  const getInputClass = (val: string) =>
    `w-full px-4 py-3 rounded-lg border bg-background outline-none transition-colors ${hasSubmitted && !val ? 'border-red-500 focus:border-red-500' : 'focus:border-foreground'}`;
  
  // Calculate taxes (e.g., 10%) — see subtotalAfterDiscount above

  const handlePlaceOrder = async () => {
    setHasSubmitted(true);

    if (!isPayExistingOrder) {
      if (!contactEmail || !firstName || !lastName || !address || !city || !state || !zipCode) {
        toast.error("Please fill out all contact and shipping information.");
        return;
      }
    }

    if (!user?.token) {
      toast.error("Please sign in to complete checkout.");
      return;
    }

    setIsProcessing(true);

    try {
      let itemsForOrder = checkoutItems as CartItem[];

      if (!isPayExistingOrder) {
        const validation = await validateCartItems(
          checkoutItems.map((item: { _id: string; name: string; qty: number }) => ({
            _id: item._id,
            name: item.name,
            qty: item.qty,
          }))
        );

        if (validation) {
          if (!buyNowItem) {
            syncCart(validation.items);
          }

          if (validation.removed.length) {
            toast.error(formatRemovedCartMessage(validation.removed));
            if (validation.items.length === 0) {
              toast.error("Add available products to your cart before checkout.");
            }
            setIsProcessing(false);
            return;
          }

          itemsForOrder = validation.items;
        }
      }

      if (!itemsForOrder.length) {
        toast.error("Your cart is empty.");
        setIsProcessing(false);
        return;
      }

      const orderData = buildOrderPayload(itemsForOrder);

      if (paymentMethod === "stripe") {
        const res = await fetch(`${apiUrl}/payments/stripe/create-checkout-session`, {
          method: "POST",
          headers: orderHeaders(),
          body: JSON.stringify(orderData),
        });
        const data = await res.json();

        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.message || "Failed to initialize Stripe checkout.");
          setIsProcessing(false);
        }
      } else if (paymentMethod === "khqr") {
        const res = await fetch(`${apiUrl}/payments/khqr/generate`, {
          method: "POST",
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
      } else if (paymentMethod === "payway") {
        const res = await fetch(`${apiUrl}/payments/payway/generate-qr`, {
          method: "POST",
          headers: orderHeaders(),
          body: JSON.stringify({
            ...orderData,
            firstName,
            lastName,
            email: contactEmail || user?.email,
            phone: phone || "090000000",
            paymentOption: "abapay_khqr",
          }),
        });
        const data = await res.json();

        if (res.ok && (data.qrString || data.qrImage)) {
          setPaywayQrString(data.qrString || null);
          setPaywayQrImage(data.qrImage || null);
          setCreatedOrderId(data.orderId);
          setPaywayWaiting(true);
          setIsProcessing(false);
          toast.success("ABA KHQR generated. Scan the code to pay.");
        } else {
          toast.error(data.message || "Failed to generate ABA PayWay QR.");
          setIsProcessing(false);
        }
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An error occurred during checkout.";
      toast.error(message);
      setIsProcessing(false);
    }
  };

  if (loadingPendingOrder || (!user && !payOrderId)) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-muted-foreground flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin" />
        {loadingPendingOrder ? "Loading order…" : "Redirecting to sign in…"}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-8 text-muted-foreground">
        <ShieldCheck className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium">
          {isPayExistingOrder ? "Complete Payment" : "Secure Checkout"}
        </span>
      </div>

      {isPayExistingOrder && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Complete payment for order <span className="font-mono font-medium">#{pendingOrder._id.slice(-8)}</span>.
          Choose a payment method below, then continue to pay securely.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Forms */}
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            {!user && (
              <p className="text-sm text-muted-foreground mb-3 rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
                <Link href="/login?redirect=%2Fcheckout" className="text-primary underline font-medium">
                  Sign in
                </Link>{" "}
                to pay with Stripe or KHQR.
              </p>
            )}
            <div className="space-y-4">
              <input type="email" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={getInputClass(contactEmail)} />
              <input type="tel" placeholder="Phone (for ABA PayWay)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg border bg-background outline-none transition-colors focus:border-foreground" />
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

          {shippingMethods.length > 0 && !isPayExistingOrder && (
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

          {!isPayExistingOrder && (
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
          )}

          <section>
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                type="button"
                onClick={() => setPaymentMethod("khqr")}
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

              <button
                type="button"
                onClick={() => setPaymentMethod("payway")}
                className={`relative p-5 rounded-2xl border-2 flex flex-col items-start gap-3 transition-all text-left overflow-hidden ${paymentMethod === 'payway' ? 'border-foreground bg-background shadow-md' : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'}`}
              >
                <div className="h-7 mb-1 flex items-center">
                  <img
                    src="https://www.ababank.com/wp-content/themes/ababank/images/aba-logo.svg"
                    alt="ABA PayWay"
                    className="h-full w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="font-bold text-sm text-[#005099]">ABA Pay</span>
                </div>
                <div>
                  <span className={`block font-semibold ${paymentMethod === 'payway' ? 'text-foreground' : 'text-muted-foreground'}`}>ABA PayWay</span>
                  <span className={`text-xs mt-1 block ${paymentMethod === 'payway' ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>ABA KHQR scan (sandbox)</span>
                </div>
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'payway' ? 'border-foreground' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'payway' && <div className="w-2.5 h-2.5 rounded-full bg-foreground animate-in zoom-in" />}
                </div>
              </button>
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
              {checkoutItems.map((item: { _id: string; name: string; image: string; price: number; qty: number }) => (
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
              disabled={isProcessing || checkoutItems.length === 0 || (paymentMethod === 'khqr' && !!khqrString) || (paymentMethod === 'payway' && !!(paywayQrString || paywayQrImage))}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-medium h-12 rounded-full hover:bg-foreground/90 transition-all active:scale-95 shadow-lg shadow-foreground/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === 'khqr' && khqrString ? (
                "Waiting for KHQR payment..."
              ) : paymentMethod === 'payway' && (paywayQrString || paywayQrImage) ? (
                "Waiting for ABA payment..."
              ) : isPayExistingOrder ? (
                "Continue to Payment"
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
