"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export type RecProduct = {
  _id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
  countInStock?: number;
};

export default function ProductRecRow({
  title,
  subtitle,
  products,
  showQuickAdd = true,
}: {
  title: string;
  subtitle?: string;
  products: RecProduct[];
  showQuickAdd?: boolean;
}) {
  const { addToCart, cartItems } = useCart();

  if (!products.length) return null;

  const inCart = new Set(cartItems.map((i) => i._id));

  const handleQuickAdd = (p: RecProduct) => {
    if ((p.countInStock ?? 1) <= 0) {
      toast.error("Out of stock");
      return;
    }
    addToCart({
      _id: p._id,
      name: p.name,
      image: p.image,
      price: p.price,
      qty: 1,
      countInStock: p.countInStock ?? 99,
    });
    toast.success("Added to cart");
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-stretch gap-4 overflow-x-auto pb-2 snap-x no-scrollbar -mx-1 px-1">
        {products.map((p) => (
          <div
            key={p._id}
            className="shrink-0 w-[9.5rem] sm:w-44 snap-start group flex flex-col"
          >
            <Link href={`/products/${p._id}`} className="block flex-1">
              <div className="aspect-square rounded-xl bg-muted overflow-hidden mb-2 relative border border-border/40">
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="176px"
                />
              </div>
              <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-primary transition-colors">
                {p.name}
              </p>
              {p.category && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {p.category}
                </p>
              )}
              <p className="text-sm font-semibold mt-1">
                <PriceDisplay amount={p.price} />
              </p>
            </Link>
            <div className="mt-auto pt-2 shrink-0">
              {showQuickAdd && !inCart.has(p._id) && (
                <button
                  type="button"
                  onClick={() => handleQuickAdd(p)}
                  className="w-full inline-flex items-center justify-center gap-1 h-8 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Plus className="size-3.5" />
                  Add
                </button>
              )}
              {inCart.has(p._id) && (
                <p className="text-center text-[11px] font-medium text-primary h-8 flex items-center justify-center">
                  In your cart
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
