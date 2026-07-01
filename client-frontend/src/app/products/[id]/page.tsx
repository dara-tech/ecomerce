"use client";

import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, ShoppingBag, Star, Plus, Minus, ArrowLeft, Heart, GitCompare } from "lucide-react";
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
  });

  const handleBuyNow = () => {
    sessionStorage.setItem("buyNow", JSON.stringify(cartPayload()));
    router.push("/checkout?buyNow=1");
  };

  if (loading) {
    return <PageLoader label="Loading product…" />;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Product not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 pb-8 pt-4 md:py-8 md:pb-8">
      <Link
        href="/products"
        className="mb-6 hidden items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:inline-flex md:mb-8"
      >
        <ArrowLeft className="size-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-24">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted md:rounded-2xl">
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col">
          <p className="mb-2 text-sm font-medium uppercase text-primary">{product.category}</p>
          <h1 className="mb-3 text-2xl font-bold leading-tight md:mb-4 md:text-4xl">{product.name}</h1>

          <div className="mb-4 flex items-center gap-4 md:mb-6">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-current opacity-20" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.numReviews || 0} Reviews)</span>
          </div>

          <p className="mb-4 text-2xl font-bold md:mb-6 md:text-3xl">
            <PriceDisplay amount={product.price} />
          </p>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:mb-8 md:text-base">
            {product.description}
          </p>

          <div className="mb-5 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() =>
                toggle({
                  _id: product._id,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  category: product.category,
                })
              }
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
                const ok = addCompare({
                  _id: product._id,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  category: product.category,
                });
                toast[ok ? "success" : "error"](ok ? "Added to compare" : "Compare list full (max 4)");
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

          <div className="mb-5 flex h-12 w-full items-center overflow-hidden rounded-full border border-border/60 bg-background sm:w-fit">
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
            <span className="flex-1 text-center text-base font-semibold tabular-nums sm:w-12 sm:flex-none">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 md:mb-8">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                addToCart(cartPayload());
                toast.success("Added to cart!");
              }}
              disabled={product.countInStock === 0}
              className="h-12 w-full gap-2.5 rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90 sm:flex-1"
            >
              <ShoppingCart className="size-5 shrink-0" />
              {product.countInStock > 0 ? t("addToCart") : t("outOfStock")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBuyNow}
              disabled={product.countInStock === 0}
              className="h-12 w-full gap-2.5 rounded-full border-2 border-foreground bg-background px-6 text-sm font-semibold text-foreground hover:bg-muted sm:flex-1"
            >
              <ShoppingBag className="size-5 shrink-0" />
              {t("buyNow")}
            </Button>
          </div>

          <div className="mt-6 space-y-2 border-t pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brand:</span>
              <span className="font-medium">{product.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Availability:</span>
              <span className={product.countInStock > 0 ? "font-medium text-green-600" : "font-medium text-destructive"}>
                {product.countInStock > 0 ? `In Stock (${product.countInStock})` : t("outOfStock")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProductRecommendations productId={String(id)} />
      <ProductReviews productId={String(id)} />
    </div>
  );
}
