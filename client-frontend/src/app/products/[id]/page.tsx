"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  ShoppingBag,
  Star,
  Plus,
  Minus,
  ArrowLeft,
  Heart,
  GitCompare,
  Store as StoreIcon,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useStore } from "@/context/StoreContext";
import PriceDisplay from "@/components/features/PriceDisplay";
import ProductRecommendations from "@/components/features/ProductRecommendations";
import ProductReviews from "@/components/features/ProductReviews";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/PageLoader";
import { cn } from "@/lib/utils";

const overlayBtn =
  "flex size-10 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground shadow-sm backdrop-blur-md transition-transform active:scale-95";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { add: addCompare, isCompared } = useCompare();
  const { track } = useRecentlyViewed();
  const { t } = useStore();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          track({
            _id: data._id,
            name: data.name,
            image: data.image,
            price: data.price,
            category: data.category,
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, track]);

  const cartPayload = () => ({
    _id: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    qty,
    countInStock: product.countInStock,
    store: product.store,
  });

  const handleAddToCart = () => {
    addToCart(cartPayload());
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    sessionStorage.setItem("buyNow", JSON.stringify(cartPayload()));
    router.push("/checkout?buyNow=1");
  };

  const inStock = product?.countInStock > 0;

  if (loading) {
    return <PageLoader label="Loading product…" />;
  }

  if (!product) {
    return (
      <div className="px-4 py-24 text-center text-muted-foreground">{t("productNotFound")}</div>
    );
  }

  const wishlistItem = {
    _id: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    category: product.category,
    store: product.store,
  };

  return (
    <div className="pb-[calc(var(--mobile-tab-bar-h)+5.25rem)] pt-4 md:container md:mx-auto md:max-w-6xl md:px-4 md:pb-12 md:pt-8">
      <Link
        href="/products"
        className="mb-6 hidden items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:inline-flex md:mb-8"
      >
        <ArrowLeft className="size-4" /> {t("backToProducts")}
      </Link>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-12 lg:gap-24">
        <div className="relative aspect-square overflow-hidden bg-muted md:rounded-2xl">
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          <div
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 md:hidden"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
          >
            <Link href="/products" className={overlayBtn} aria-label={t("backToProducts")}>
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggle(wishlistItem)}
                className={cn(
                  overlayBtn,
                  isInWishlist(product._id) && "border-red-500/50 bg-red-500/10 text-red-500"
                )}
                aria-label={t("wishlist")}
              >
                <Heart className={cn("size-4", isInWishlist(product._id) && "fill-current")} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = addCompare(wishlistItem);
                  toast[ok ? "success" : "error"](
                    ok ? "Added to compare" : "Compare list full (max 4)"
                  );
                }}
                className={cn(
                  overlayBtn,
                  isCompared(product._id) && "border-primary/50 bg-primary/10 text-primary"
                )}
                aria-label={t("compare")}
              >
                <GitCompare className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col px-4 pt-5 md:px-0 md:pt-0">
          {product.category && (
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="mb-2 inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {product.category}
            </Link>
          )}

          <h1 className="text-xl font-bold leading-tight tracking-tight md:text-4xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-current opacity-20 md:size-4" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground md:text-sm">
              ({product.numReviews || 0} {t("reviews")})
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold tabular-nums md:mt-6 md:text-3xl">
            <PriceDisplay amount={product.price} />
          </p>

          {product.store && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background border border-border/60 overflow-hidden">
                  {product.store.logo ? (
                    <img src={product.store.logo} alt={product.store.name} className="size-full object-cover" />
                  ) : (
                    <StoreIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Sold by</span>
                  <Link href={`/store/${product.store._id}`} className="text-sm font-semibold hover:underline">
                    {product.store.name}
                  </Link>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-full" 
                onClick={() => router.push(`/chat?vendor=${product.store._id}`)}
              >
                <MessageCircle className="size-4" />
                <span className="hidden sm:inline">Contact Seller</span>
                <span className="sm:hidden">Contact</span>
              </Button>
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:mt-6 md:text-base">
            {product.description}
          </p>

          <div className="mt-5 hidden items-center gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => toggle(wishlistItem)}
              className={cn(
                "size-11 rounded-full",
                isInWishlist(product._id) && "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/15"
              )}
              aria-label={t("wishlist")}
            >
              <Heart className={cn("size-4", isInWishlist(product._id) && "fill-current")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() => {
                const ok = addCompare(wishlistItem);
                toast[ok ? "success" : "error"](
                  ok ? "Added to compare" : "Compare list full (max 4)"
                );
              }}
              className={cn(
                "size-11 rounded-full",
                isCompared(product._id) && "border-primary bg-primary/10 text-primary hover:bg-primary/15"
              )}
              aria-label={t("compare")}
            >
              <GitCompare className="size-4" />
            </Button>
          </div>

          <div className="mt-5 flex h-12 w-full items-center overflow-hidden rounded-full border border-border/60 bg-background md:w-fit">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="size-12 shrink-0 rounded-none"
              disabled={qty <= 1}
            >
              <Minus className="size-4" />
            </Button>
            <span className="flex-1 text-center text-base font-semibold tabular-nums md:w-12 md:flex-none">
              {qty}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => setQty(qty + 1)}
              className="size-12 shrink-0 rounded-none"
              disabled={qty >= product.countInStock}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="mt-5 hidden gap-3 sm:flex-row md:flex">
            <Button
              type="button"
              size="lg"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="h-12 w-full gap-2.5 rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90 sm:flex-1"
            >
              <ShoppingCart className="size-5 shrink-0" />
              {inStock ? t("addToCart") : t("outOfStock")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBuyNow}
              disabled={!inStock}
              className="h-12 w-full gap-2.5 rounded-full border-2 border-foreground bg-background px-6 text-sm font-semibold text-foreground hover:bg-muted sm:flex-1"
            >
              <ShoppingBag className="size-5 shrink-0" />
              {t("buyNow")}
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{t("brand")}</span>
              <span className="font-medium">{product.brand || "—"}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
              <span className="text-muted-foreground">{t("availability")}</span>
              <span
                className={cn(
                  "font-medium",
                  inStock ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}
              >
                {inStock
                  ? t("inStockCount").replace("{count}", String(product.countInStock))
                  : t("outOfStock")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8 px-4 md:mt-12 md:space-y-12 md:px-0">
        <ProductRecommendations productId={String(id)} />
        <ProductReviews productId={String(id)} />
      </div>

      <div className="mobile-dock-above-tabs md:hidden">
        <div className="flex gap-2 border-t border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <ShoppingCart className="size-4 shrink-0" />
            {inStock ? t("addToCart") : t("outOfStock")}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!inStock}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-foreground bg-background text-sm font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <ShoppingBag className="size-4 shrink-0" />
            {t("buyNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
