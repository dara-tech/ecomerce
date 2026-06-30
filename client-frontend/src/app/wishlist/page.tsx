"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useStore } from "@/context/StoreContext";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useStore();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Heart className="size-8 text-red-500" /> {t("wishlist")}
      </h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Your wishlist is empty.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li key={p._id} className="flex gap-4 p-4 border border-border/60 rounded-2xl bg-card">
              <Link href={`/products/${p._id}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                <ProductImage src={p.image} alt={p.name} fill className="object-cover" sizes="80px" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${p._id}`} className="font-medium hover:underline">{p.name}</Link>
                <p className="text-sm font-semibold mt-1"><PriceDisplay amount={p.price} /></p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addToCart({ _id: p._id, name: p.name, image: p.image, price: p.price, qty: 1, countInStock: 99 });
                    toast.success("Added to cart");
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground"
                >
                  {t("addToCart")}
                </button>
                <button type="button" onClick={() => remove(p._id)} className="text-xs text-destructive flex items-center gap-1">
                  <Trash2 className="size-3" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
