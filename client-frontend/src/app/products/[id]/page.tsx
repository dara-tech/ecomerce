"use client";

import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Star, Plus, Minus, ArrowLeft, Heart, GitCompare, Zap } from "lucide-react";
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
    return <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Loading product details...</div>;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Product not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        <div className="aspect-square bg-muted rounded-2xl relative overflow-hidden">
          <ProductImage src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-primary font-medium uppercase mb-2">{product.category}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current opacity-20" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.numReviews || 0} Reviews)</span>
          </div>

          <p className="text-3xl font-bold mb-6"><PriceDisplay amount={product.price} /></p>
          <p className="text-muted-foreground mb-8 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => toggle({ _id: product._id, name: product.name, image: product.image, price: product.price, category: product.category })}
              className={`h-10 w-10 rounded-full border flex items-center justify-center transition-colors ${isInWishlist(product._id) ? "border-red-500 text-red-500 bg-red-500/10" : "border-border hover:bg-muted"}`}
              aria-label={t("wishlist")}
            >
              <Heart className={`size-4 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                const ok = addCompare({ _id: product._id, name: product.name, image: product.image, price: product.price, category: product.category });
                toast[ok ? "success" : "error"](ok ? "Added to compare" : "Compare list full (max 4)");
              }}
              className={`h-10 w-10 rounded-full border flex items-center justify-center ${isCompared(product._id) ? "border-primary text-primary bg-primary/10" : "border-border hover:bg-muted"}`}
              aria-label={t("compare")}
            >
              <GitCompare className="size-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center border border-border/60 rounded-full h-12 w-fit bg-background">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-full flex items-center justify-center" disabled={qty <= 1}>
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="w-12 h-full flex items-center justify-center" disabled={qty >= product.countInStock}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              type="button"
              onClick={() => {
                addToCart(cartPayload());
                toast.success("Added to cart!");
              }}
              disabled={product.countInStock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background font-medium h-12 px-8 rounded-full disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.countInStock > 0 ? t("addToCart") : t("outOfStock")}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.countInStock === 0}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-medium h-12 px-8 rounded-full disabled:opacity-50 hover:bg-primary/5"
            >
              <Zap className="w-5 h-5" /> {t("buyNow")}
            </button>
          </div>

          <div className="border-t pt-6 space-y-2 text-sm">
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
