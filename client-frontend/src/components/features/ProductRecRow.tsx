"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import MobileProductCard, {
  MobileProductRail,
  MobileSectionHeader,
} from "@/components/ui/MobileProductCard";
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

  const quickAddFooter = (p: RecProduct) => {
    if (!showQuickAdd) return null;
    if (inCart.has(p._id)) {
      return (
        <p className="flex h-8 items-center justify-center text-center text-[11px] font-medium text-primary">
          In your cart
        </p>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleQuickAdd(p)}
        className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full border border-border text-xs font-medium transition-colors hover:bg-muted"
      >
        <Plus className="size-3.5" />
        Add
      </button>
    );
  };

  return (
    <section className="md:container md:mx-auto md:px-4">
      <MobileSectionHeader title={title} subtitle={subtitle} href="/products" />

      <MobileProductRail>
        {products.map((p) => (
          <MobileProductCard
            key={p._id}
            id={p._id}
            name={p.name}
            image={p.image}
            price={p.price}
            category={p.category}
            footer={quickAddFooter(p)}
          />
        ))}
      </MobileProductRail>

      <div className="hidden gap-6 md:grid md:grid-cols-4 lg:grid-cols-6">
        {products.map((p) => (
          <div key={`desktop-${p._id}`} className="flex flex-col">
            <Link href={`/products/${p._id}`} className="group block flex-1">
              <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted">
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="176px"
                />
              </div>
              <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 group-hover:text-primary">
                {p.name}
              </p>
              {p.category && (
                <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.category}
                </p>
              )}
              <p className="mt-1 text-sm font-semibold tabular-nums">
                <PriceDisplay amount={p.price} />
              </p>
            </Link>
            <div className="mt-2 shrink-0">{quickAddFooter(p)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
