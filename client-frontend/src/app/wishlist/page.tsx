"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
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
    <div className="container mx-auto max-w-2xl px-4 pb-6 pt-4 md:py-12">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl font-bold tracking-tight md:text-3xl">{t("wishlist")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("wishlistHint")}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-14 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-red-500/10">
            <Heart className="size-7 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground">{t("wishlistEmpty")}</p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform active:scale-[0.98] hover:bg-foreground/90"
          >
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li
              key={p._id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <div className="flex gap-3 p-3 md:gap-4 md:p-4">
                <Link
                  href={`/products/${p._id}`}
                  className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-muted md:size-20"
                >
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    fill
                    compactPlaceholder
                    className="object-cover"
                    sizes="80px"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <Link
                    href={`/products/${p._id}`}
                    className="line-clamp-2 text-sm font-semibold leading-snug hover:underline md:text-base"
                  >
                    {p.name}
                  </Link>
                  {p.category && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.category}</p>
                  )}
                  <p className="mt-1.5 text-sm font-bold tabular-nums">
                    <PriceDisplay amount={p.price} />
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border/60 p-3 md:px-4">
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      _id: p._id,
                      name: p.name,
                      image: p.image,
                      price: p.price,
                      qty: 1,
                      countInStock: 99,
                    });
                    toast.success("Added to cart");
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98] hover:bg-foreground/90"
                >
                  <ShoppingCart className="size-4 shrink-0" />
                  {t("addToCart")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(p._id)}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  aria-label={t("remove")}
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">{t("remove")}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
