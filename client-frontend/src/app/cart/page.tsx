"use client";

import { useMemo } from "react";

import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import SmartShopRecommendations from "@/components/features/SmartShopRecommendations";
import { useStore } from "@/context/StoreContext";
import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus, Store as StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQty, cartTotal } = useCart();
  const { t } = useStore();

  const itemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 pb-6 pt-4 md:py-16">
        <h1 className="mb-4 text-xl font-bold tracking-tight md:mb-8 md:text-3xl">{t("yourCart")}</h1>

        <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-14 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">{t("cartEmpty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("cartEmptyHint")}</p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform active:scale-[0.98] hover:bg-foreground/90"
          >
            {t("continueShopping")}
          </Link>
        </div>

        <div className="mt-8">
          <SmartShopRecommendations />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 pb-[calc(var(--mobile-tab-bar-h)+5.25rem)] pt-4 md:pb-12 md:py-8">
      <h1 className="mb-4 text-xl font-bold tracking-tight md:mb-8 md:text-3xl">{t("yourCart")}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2 lg:space-y-8">
          {useMemo(() => {
            const groups: Record<string, { store: { _id: string, name: string } | null, items: typeof cartItems }> = {};
            cartItems.forEach((item) => {
              const storeId = item.store?._id || "platform";
              if (!groups[storeId]) {
                groups[storeId] = { store: item.store || null, items: [] };
              }
              groups[storeId].items.push(item);
            });
            return Object.values(groups);
          }, [cartItems]).map((group) => (
            <div key={group.store?._id || "platform"} className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <StoreIcon className="size-4" />
                <span>Sold by: <strong className="text-foreground font-semibold">{group.store ? group.store.name : "Platform Products"}</strong></span>
              </div>
              <div className="space-y-3 lg:space-y-4">
                {group.items.map((item) => (
            <article
              key={item._id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <div className="flex items-stretch gap-3 p-3 md:gap-4 md:p-4">
                <Link
                  href={`/products/${item._id}`}
                  className="relative min-h-[96px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-muted md:w-24"
                >
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    fill
                    compactPlaceholder
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>

                <div className="flex min-h-[96px] min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item._id}`}
                        className="line-clamp-2 text-sm font-semibold leading-snug hover:underline md:text-base"
                      >
                        {item.name}
                      </Link>
                      {item.qty > 1 && (
                        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                          <PriceDisplay amount={item.price} /> {t("priceEach")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("remove")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-9 items-center overflow-hidden rounded-full border border-border/60 bg-background">
                      <button
                        type="button"
                        onClick={() => updateQty(item._id, Math.max(1, item.qty - 1))}
                        className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item._id, Math.min(item.countInStock, item.qty + 1))}
                        className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        disabled={item.qty >= item.countInStock}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold tabular-nums md:text-base">
                      <PriceDisplay amount={item.price * item.qty} />
                    </p>
                  </div>
                </div>
              </div>
            </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">{t("orderSummary")}</h2>

            <div className="mb-6 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("subtotalItems").replace("{count}", String(itemCount))}</span>
                <span className="tabular-nums">
                  <PriceDisplay amount={cartTotal} />
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("shipping")}</span>
                <span>{t("calculatedAtCheckout")}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("tax")}</span>
                <span>{t("calculatedAtCheckout")}</span>
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
                <span>{t("total")}</span>
                <span className="tabular-nums">
                  <PriceDisplay amount={cartTotal} />
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex h-12 w-full items-center justify-center rounded-full bg-foreground text-base font-semibold text-background transition-transform hover:bg-foreground/90 active:scale-[0.98]"
            >
              {t("proceedToCheckout")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SmartShopRecommendations />
      </div>

      <div
        className="mobile-dock-above-tabs lg:hidden"
      >
        <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("subtotalItems").replace("{count}", String(itemCount))}
            </p>
            <p className="text-lg font-bold tabular-nums">
              <PriceDisplay amount={cartTotal} />
            </p>
          </div>
          <Link
            href="/checkout"
            className={cn(
              "inline-flex h-11 flex-1 max-w-[220px] items-center justify-center rounded-full",
              "bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98]"
            )}
          >
            {t("proceedToCheckout")}
          </Link>
        </div>
      </div>
    </div>
  );
}
