"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, QrCode, MapPin } from "lucide-react";
import { useCart, type CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/authSession";
import { verifyPaymentStatus } from "@/lib/verifyPayment";
import { useStore } from "@/context/StoreContext";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import Link from "next/link";
import { Suspense } from "react";
import { getApiUrl } from "@/lib/api";
import { validateCartItems, formatRemovedCartMessage } from "@/lib/cartValidation";
import { PageLoader, InlineLoader } from "@/components/ui/PageLoader";
import { cn } from "@/lib/utils";
import LocationMapModal from "@/components/ui/LocationMapModal";
import SavedAddressSelector from "@/components/ui/SavedAddressSelector";

function QrPaymentActions({
  providerIssue,
  onCheckPayment,
  orderId,
}: {
  providerIssue: boolean;
  onCheckPayment: () => Promise<void>;
  orderId: string | null;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <InlineLoader />
        <span>Confirming payment…</span>
      </div>
      {providerIssue && (
        <p className="text-center text-xs text-amber-600">Auto-confirm delayed — tap below if you paid.</p>
      )}
      <button
        type="button"
        onClick={onCheckPayment}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98]"
      >
        I already paid
      </button>
      {orderId && (
        <Link
          href={`/checkout/success?order_id=${orderId}`}
          className="inline-flex h-10 items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View order
        </Link>
      )}
    </div>
  );
}

function QrPaymentModal({
  open,
  amount,
  qrNode,
  waiting,
  providerIssue,
  onCheckPayment,
  orderId,
}: {
  open: boolean;
  amount: number;
  qrNode: ReactNode;
  waiting: boolean;
  providerIssue: boolean;
  onCheckPayment: () => Promise<void>;
  orderId: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex md:items-center md:justify-center md:bg-black/50 md:p-4 md:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR to pay"
    >
      <div className="flex h-[100dvh] w-full flex-col bg-background md:h-auto md:max-h-[min(92dvh,640px)] md:max-w-lg md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-border/60">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-5">
          <p className="text-base font-semibold md:text-lg">Scan to pay</p>
          <p className="text-xl font-bold tabular-nums md:text-2xl">
            <PriceDisplay amount={amount} />
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:overflow-visible md:py-5">
          <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border/60">
            <div className="flex w-full justify-center [&_img]:max-h-[min(42dvh,300px)] [&_img]:w-full [&_img]:object-contain [&_svg]:h-auto [&_svg]:max-h-[min(42dvh,300px)] [&_svg]:w-full">
              {qrNode}
            </div>
          </div>
        </div>

        {waiting && (
          <div className="shrink-0 border-t border-border/60 bg-background px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:px-6 md:pb-5">
            <QrPaymentActions
              providerIssue={providerIssue}
              onCheckPayment={onCheckPayment}
              orderId={orderId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buyNow") === "1";
  const payOrderId = searchParams.get("payOrder");
  const { cartItems, cartTotal, clearCart, syncCart } = useCart();
  const { user, isInitialized } = useAuth();
  const { t } = useStore();
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
  const [qrDisplaySize, setQrDisplaySize] = useState(320);

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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("checkout_address");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contactEmail) setContactEmail(parsed.contactEmail);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.city) setCity(parsed.city);
        if (parsed.state) setState(parsed.state);
        if (parsed.zipCode) setZipCode(parsed.zipCode);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = { contactEmail, firstName, lastName, phone, address, city, state, zipCode };
      localStorage.setItem("checkout_address", JSON.stringify(data));
    }, 500);
    return () => clearTimeout(timer);
  }, [contactEmail, firstName, lastName, phone, address, city, state, zipCode]);

  useEffect(() => {
    if (payOrderId) {
      setCurrentStep(2);
    }
  }, [payOrderId]);

  const handleContinueToPayment = async () => {
    setHasSubmitted(true);
    if (!firstName || !lastName || !address || !city || !state || !zipCode || !contactEmail) {
      toast.error("Please fill in all contact and shipping address fields.");
      return;
    }

    if (user && saveAddressToProfile) {
      try {
        const currentAddresses = user.addresses || [];
        const newAddress = { firstName, lastName, address, city, state, zipCode, country: "Cambodia" };
        const res = await authFetch(`${apiUrl}/users/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: [...currentAddresses, newAddress] })
        });
        if (res.ok) {
          toast.success("Address saved to your profile!");
          setSaveAddressToProfile(false);
        }
      } catch (err) {
        console.error("Failed to save address", err);
      }
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    const syncQrSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setQrDisplaySize(Math.min(380, Math.round(width * 0.92)));
      } else {
        setQrDisplaySize(280);
      }
    };
    syncQrSize();
    window.addEventListener("resize", syncQrSize);
    return () => window.removeEventListener("resize", syncQrSize);
  }, []);

  useEffect(() => {
    if (!payOrderId) {
      setPendingOrder(null);
      setLoadingPendingOrder(false);
      return;
    }
    if (!isInitialized) return;
    if (!user?.token) {
      setLoadingPendingOrder(false);
      return;
    }

    let cancelled = false;
    setLoadingPendingOrder(true);

    authFetch(`${apiUrl}/orders/${payOrderId}`)
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
  }, [payOrderId, isInitialized, user, apiUrl, router]);

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

  const checkPaymentNow = useCallback(async (orderId: string, token: string, md5?: string | null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      return await verifyPaymentStatus(orderId, token, {
        md5,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (!khqrString || !createdOrderId || !user?.token) {
      setKhqrWaiting(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;
    let pollDelayMs = 3000;
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
        const result = await checkPaymentNow(orderId, token, khqrMd5Ref.current);
        errorStreak = 0;
        pollDelayMs = 3000;

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
  }, [khqrString, createdOrderId, user?.token, checkPaymentNow, finishCheckout, router]);

  useEffect(() => {
    if ((!paywayQrString && !paywayQrImage) || !createdOrderId || !user?.token) {
      setPaywayWaiting(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;
    let pollDelayMs = 3000;
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
        const result = await checkPaymentNow(orderId, token);
        errorStreak = 0;
        pollDelayMs = 3000;

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
  }, [paywayQrString, paywayQrImage, createdOrderId, user?.token, checkPaymentNow, finishCheckout, router]);

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
      if (paywayQrString || paywayQrImage) {
        return (
          <div className="flex items-center gap-3 py-1">
            <InlineLoader />
            <p className="text-sm text-muted-foreground">QR payment open — scan in the popup to complete.</p>
          </div>
        );
      }
      return (
        <div className="py-4 text-center">
          <QrCode className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-semibold">ABA PayWay KHQR</p>
          <p className="mt-1 text-sm text-muted-foreground">Place order to open the scan popup.</p>
        </div>
      );
    }

    if (paymentMethod === "khqr") {
      if (khqrString) {
        return (
          <div className="flex items-center gap-3 py-1">
            <InlineLoader />
            <p className="text-sm text-muted-foreground">QR payment open — scan in the popup to complete.</p>
          </div>
        );
      }
      return (
        <div className="py-4 text-center">
          <QrCode className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-semibold">KHQR</p>
          <p className="mt-1 text-sm text-muted-foreground">Place order to open the scan popup.</p>
        </div>
      );
    }

    return null;
  };

  const getInputClass = (val: string) =>
    `w-full rounded-xl border bg-background px-4 py-3 outline-none transition-colors ${hasSubmitted && !val ? "border-red-500 focus:border-red-500" : "border-border/60 focus:border-foreground"}`;

  const placeOrderDisabled =
    isProcessing ||
    checkoutItems.length === 0 ||
    (paymentMethod === "khqr" && !!khqrString) ||
    (paymentMethod === "payway" && !!(paywayQrString || paywayQrImage));

  const awaitingQrPayment = !!(khqrString || paywayQrString || paywayQrImage);
  const showMobileDock = !awaitingQrPayment;
  const itemCount = checkoutItems.reduce(
    (acc: number, item: { qty: number }) => acc + item.qty,
    0
  );

  const handleManualPaywayCheck = useCallback(async () => {
    if (!createdOrderId || !user?.token) return;
    try {
      const result = await checkPaymentNow(createdOrderId, user.token);
      if (result.paid) {
        toast.success("Payment confirmed!");
        finishCheckout();
        router.push(`/checkout/success?order_id=${createdOrderId}`);
      } else {
        toast.info(result.message || "Payment not detected yet. Wait a moment and try again.");
      }
    } catch {
      toast.error("Network error. Try again.");
    }
  }, [createdOrderId, user?.token, checkPaymentNow, finishCheckout, router]);

  const handleManualKhqrCheck = useCallback(async () => {
    if (!createdOrderId || !user?.token) return;
    try {
      const result = await checkPaymentNow(createdOrderId, user.token, khqrMd5Ref.current);
      if (result.paid) {
        toast.success("Payment confirmed!");
        finishCheckout();
        router.push(`/checkout/success?order_id=${createdOrderId}`);
      } else {
        toast.info(result.message || "Payment not detected yet. Wait a moment and try again.");
      }
    } catch {
      toast.error("Network error. Try again.");
    }
  }, [createdOrderId, user?.token, checkPaymentNow, finishCheckout, router]);

  const qrPaymentModal = useMemo(() => {
    if (paymentMethod === "payway" && (paywayQrString || paywayQrImage)) {
      return {
        waiting: paywayWaiting,
        providerIssue: paywayProviderIssue,
        onCheckPayment: handleManualPaywayCheck,
        qrNode: paywayQrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={paywayQrImage} alt="ABA PayWay KHQR" className="w-full" />
        ) : paywayQrString ? (
          <QRCode value={paywayQrString} size={qrDisplaySize} />
        ) : null,
      };
    }
    if (paymentMethod === "khqr" && khqrString) {
      return {
        waiting: khqrWaiting,
        providerIssue: khqrProviderIssue,
        onCheckPayment: handleManualKhqrCheck,
        qrNode: <QRCode value={khqrString} size={qrDisplaySize} />,
      };
    }
    return null;
  }, [
    paymentMethod,
    paywayQrString,
    paywayQrImage,
    khqrString,
    paywayWaiting,
    paywayProviderIssue,
    khqrWaiting,
    khqrProviderIssue,
    handleManualPaywayCheck,
    handleManualKhqrCheck,
    qrDisplaySize,
  ]);

  const placeOrderLabel = isProcessing
    ? t("processing")
    : paymentMethod === "khqr" && khqrString
      ? t("waitingKhqr")
      : paymentMethod === "payway" && (paywayQrString || paywayQrImage)
        ? t("waitingAba")
        : !isPayExistingOrder && currentStep === 1
          ? "Continue to Payment"
          : isPayExistingOrder
            ? t("pay")
            : t("placeOrder");

  const placeOrderLabelShort = !isPayExistingOrder && currentStep === 1 ? "Continue" : isPayExistingOrder ? t("pay") : t("placeOrder");

  const sectionClass = "rounded-2xl border border-border/60 bg-card p-4 md:p-5";
  const paymentOptionClass = (active: boolean) =>
    cn(
      "relative flex shrink-0 flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-all",
      "md:flex-row md:items-center md:gap-4 md:p-4",
      "min-w-[8.75rem] md:w-full md:min-w-0",
      active
        ? "border-foreground bg-background shadow-sm"
        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
    );
  
  // Calculate taxes (e.g., 10%) — see subtotalAfterDiscount above

  const handlePlaceOrder = async () => {
    setHasSubmitted(true);

    if (!isPayExistingOrder && currentStep === 1) {
      handleContinueToPayment();
      return;
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
      <PageLoader
        label={loadingPendingOrder ? "Loading order…" : "Redirecting to sign in…"}
      />
    );
  }

  return (
    <div
      className={cn(
        "container mx-auto max-w-4xl px-4 pt-4 md:pb-8 md:pt-8",
        showMobileDock ? "pb-[var(--mobile-action-dock-h)]" : "pb-[calc(1rem+var(--mobile-safe-bottom))]"
      )}
    >
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl font-bold tracking-tight md:text-3xl">
          {isPayExistingOrder ? t("completePayment") : t("checkout")}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-green-500" />
          <span className="text-sm">{t("secureCheckout")}</span>
        </div>
      </div>

      {isPayExistingOrder && (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm md:mb-6">
          {t("completePaymentHint").replace("{id}", pendingOrder._id.slice(-8))}
        </div>
      )}

      {!isPayExistingOrder && (
        <div className="mb-6 flex items-center justify-between md:mb-8 md:max-w-md">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors", currentStep >= 1 ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>1</div>
            <span className={cn("text-xs font-semibold", currentStep >= 1 ? "text-foreground" : "text-muted-foreground")}>Shipping</span>
          </div>
          <div className={cn("h-0.5 flex-1 transition-colors", currentStep >= 2 ? "bg-foreground" : "bg-border/60")} />
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors", currentStep >= 2 ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>2</div>
            <span className={cn("text-xs font-semibold", currentStep >= 2 ? "text-foreground" : "text-muted-foreground")}>Payment</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        {/* Order summary — first on mobile */}
        <div className="order-1 md:order-2">
          <div className={cn(sectionClass, "md:sticky md:top-24")}>
            <h2 className="mb-3 text-base font-bold md:mb-4 md:text-xl">{t("yourOrder")}</h2>

            <div className="max-h-44 space-y-3 overflow-y-auto overscroll-contain border-b border-border/60 pb-4 md:max-h-none md:space-y-4 md:pb-6">
              {checkoutItems.map((item: { _id: string; name: string; image: string; price: number; qty: number }) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="relative size-14 overflow-hidden rounded-xl bg-muted md:size-16">
                      <ProductImage src={item.image} alt={item.name} fill className="object-cover" compactPlaceholder sizes="64px" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background ring-2 ring-card">
                      {item.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</h4>
                  </div>
                  <div className="shrink-0 text-sm font-semibold tabular-nums">
                    <PriceDisplay amount={item.price * item.qty} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-medium tabular-nums">
                  <PriceDisplay amount={checkoutTotal} />
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between gap-3 text-green-600">
                  <span>{t("discount")} ({couponCode})</span>
                  <span className="font-medium tabular-nums">
                    -<PriceDisplay amount={couponDiscount} />
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="font-medium">
                  {freeShipping || shippingPrice === 0 ? t("free") : <PriceDisplay amount={shippingPrice} />}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("taxes")}</span>
                <span className="font-medium tabular-nums">
                  <PriceDisplay amount={taxes} />
                </span>
              </div>
            </div>

            <div className="mt-4 hidden items-center justify-between md:flex">
              <span className="font-bold">{t("total")}</span>
              <span className="text-2xl font-bold tabular-nums">
                <PriceDisplay amount={finalTotal} />
              </span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placeOrderDisabled}
              className="mt-6 hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 md:flex"
            >
              {isProcessing ? (
                <>
                  <InlineLoader size="sm" className="size-5 border-2" />
                  {t("processing")}
                </>
              ) : (
                placeOrderLabel
              )}
            </button>
          </div>
        </div>

        {/* Forms + payment */}
        <div className="order-2 space-y-4 md:order-1 md:space-y-5">
          {!isPayExistingOrder && currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 md:space-y-5">
              <section className={sectionClass}>
                <h2 className="mb-3 text-base font-bold md:text-lg">{t("contactInfo")}</h2>
                {!user && (
                  <p className="mb-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <Link href="/login?redirect=%2Fcheckout" className="font-medium text-foreground underline">
                      {t("signIn")}
                    </Link>{" "}
                    {t("signInToPay")}
                  </p>
                )}
                <div className="space-y-3">
                  <input type="email" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={getInputClass(contactEmail)} />
                  <input type="tel" placeholder="Phone (ABA PayWay)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 outline-none transition-colors focus:border-foreground" />
                </div>
              </section>

              {user && user.addresses && user.addresses.length > 0 && (
                <SavedAddressSelector 
                  addresses={user.addresses} 
                  selectedId={selectedSavedAddressId}
                  onSelect={(addr) => {
                    setFirstName(addr.firstName || "");
                    setLastName(addr.lastName || "");
                    setAddress(addr.address || "");
                    setCity(addr.city || "");
                    setState(addr.state || "");
                    setZipCode(addr.zipCode || "");
                    setSelectedSavedAddressId(addr._id);
                    toast.success("Address auto-filled");
                  }} 
                />
              )}

              <section className={sectionClass}>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-bold md:text-lg">{t("shippingAddress")}</h2>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-full bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20 sm:self-auto"
                  >
                    <MapPin className="size-3.5" />
                    Select Location on Map
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={getInputClass(firstName)} />
                    <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={getInputClass(lastName)} />
                  </div>
                  <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className={getInputClass(address)} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={getInputClass(city)} />
                    <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className={getInputClass(state)} />
                    <input type="text" placeholder="ZIP" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={cn(getInputClass(zipCode), "col-span-2 sm:col-span-1")} />
                  </div>
                  
                  {user && (
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={saveAddressToProfile} 
                        onChange={(e) => setSaveAddressToProfile(e.target.checked)} 
                        className="rounded border-border accent-foreground"
                      />
                      <span className="text-sm font-medium">Save this address to my profile</span>
                    </label>
                  )}
                </div>
              </section>
            </div>
          )}

          {!isPayExistingOrder && currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 md:space-y-5">
              <button onClick={() => setCurrentStep(1)} className="text-sm font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground">← Back to Shipping</button>

              {shippingMethods.length > 0 && (
                <section className={sectionClass}>
                  <h2 className="mb-3 text-base font-bold md:text-lg">{t("shippingMethod")}</h2>
                  <div className="space-y-2">
                    {shippingMethods.map((m) => (
                      <label
                        key={m._id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 transition-all",
                          selectedShippingId === m._id ? "border-foreground bg-background" : "border-border/60"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShippingId === m._id}
                            onChange={() => setSelectedShippingId(m._id)}
                            className="accent-foreground"
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-medium">{m.name}</span>
                            {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-medium">
                          {freeShipping ? t("free") : m.type === "free" ? t("free") : t("calculatedAtCheckout")}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              <section className={sectionClass}>
                <h2 className="mb-3 text-base font-bold md:text-lg">{t("couponCode")}</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CODE"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
                  >
                    {t("apply")}
                  </button>
                </div>
                {couponCode && (
                  <p className="mt-2 text-sm text-green-600">
                    {couponCode} — <PriceDisplay amount={couponDiscount} /> off
                    {freeShipping ? ` + ${t("free")} ${t("shipping").toLowerCase()}` : ""}
                  </p>
                )}
              </section>
            </div>
          )}

          {(currentStep === 2 || isPayExistingOrder) && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 md:space-y-5">
              <section className={sectionClass}>
                <h2 className="mb-3 text-base font-bold md:text-lg">{t("paymentMethod")}</h2>

                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar md:mx-0 md:flex-col md:gap-3 md:overflow-visible md:pb-0">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className={paymentOptionClass(paymentMethod === "stripe")}
                  >
                    <div className="flex h-6 items-center md:h-7 md:w-16 md:shrink-0">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                        alt="Stripe"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={cn("text-sm font-semibold", paymentMethod !== "stripe" && "text-muted-foreground")}>
                        {t("creditCard")}
                      </span>
                      <span className="hidden text-xs text-muted-foreground md:block">Visa, Mastercard, Apple Pay</span>
                    </div>
                    <div className={cn("absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 md:relative md:right-auto md:top-auto md:ml-auto", paymentMethod === "stripe" ? "border-foreground" : "border-border/60")}>
                      {paymentMethod === "stripe" && <div className="size-2 rounded-full bg-foreground" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("khqr")}
                    className={paymentOptionClass(paymentMethod === "khqr")}
                  >
                    <div className="flex h-6 items-center md:h-7 md:w-16 md:shrink-0">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/bb/KHQR_Logo.png"
                        alt="KHQR"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={cn("text-sm font-semibold", paymentMethod !== "khqr" && "text-muted-foreground")}>
                        {t("khqrScan")}
                      </span>
                      <span className="hidden text-xs text-muted-foreground md:block">ABA, Bakong, ACLEDA</span>
                    </div>
                    <div className={cn("absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 md:relative md:right-auto md:top-auto md:ml-auto", paymentMethod === "khqr" ? "border-foreground" : "border-border/60")}>
                      {paymentMethod === "khqr" && <div className="size-2 rounded-full bg-foreground" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("payway")}
                    className={paymentOptionClass(paymentMethod === "payway")}
                  >
                    <div className="flex h-6 items-center gap-1 md:h-7 md:w-16 md:shrink-0">
                      <img
                        src="https://www.ababank.com/wp-content/themes/ababank/images/aba-logo.svg"
                        alt="ABA PayWay"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={cn("text-sm font-semibold", paymentMethod !== "payway" && "text-muted-foreground")}>
                        {t("abaPayway")}
                      </span>
                      <span className="hidden text-xs text-muted-foreground md:block">ABA KHQR scan</span>
                    </div>
                    <div className={cn("absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 md:relative md:right-auto md:top-auto md:ml-auto", paymentMethod === "payway" ? "border-foreground" : "border-border/60")}>
                      {paymentMethod === "payway" && <div className="size-2 rounded-full bg-foreground" />}
                    </div>
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-6">
                  {renderPaymentDetails()}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {showMobileDock && (
        <div className="mobile-dock-safe-bottom md:hidden">
          <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("subtotalItems").replace("{count}", String(itemCount))}
              </p>
              <p className="text-lg font-bold tabular-nums">
                <PriceDisplay amount={finalTotal} />
              </p>
            </div>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placeOrderDisabled}
              className={cn(
                "inline-flex h-11 max-w-[11rem] flex-1 items-center justify-center gap-2 rounded-full",
                "bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98]",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              {isProcessing && <InlineLoader size="sm" className="size-4 border-2" />}
              {isProcessing ? t("processing") : placeOrderLabelShort}
            </button>
          </div>
        </div>
      )}

      {awaitingQrPayment && qrPaymentModal && (
        <QrPaymentModal
          open
          amount={finalTotal}
          waiting={qrPaymentModal.waiting}
          providerIssue={qrPaymentModal.providerIssue}
          onCheckPayment={qrPaymentModal.onCheckPayment}
          orderId={createdOrderId}
          qrNode={qrPaymentModal.qrNode}
        />
      )}

      <LocationMapModal
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(data) => {
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
          if (data.zipCode) setZipCode(data.zipCode);
          setIsMapOpen(false);
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading checkout…" />}>
      <CheckoutContent />
    </Suspense>
  );
}
