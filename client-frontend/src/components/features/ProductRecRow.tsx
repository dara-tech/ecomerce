"use client";

import { Plus } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import {
  CatalogProductCard,
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
  const { t } = useStore();

  if (!products.length) return null;

  const inCart = new Set(cartItems.map((i) => i._id));
  const displayProducts = products.slice(0, 8);

  const handleQuickAdd = (p: RecProduct) => {
    if ((p.countInStock ?? 1) <= 0) {
      toast.error(t("outOfStock"));
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
        <p className="mt-2 flex h-8 items-center justify-center text-center text-[11px] font-medium text-primary">
          {t("inYourCart")}
        </p>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleQuickAdd(p)}
        className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-full border border-border/60 text-xs font-medium transition-colors hover:bg-muted active:scale-[0.98]"
      >
        <Plus className="size-3.5" />
        {t("quickAdd")}
      </button>
    );
  };

  return (
    <section className="px-4 md:container md:mx-auto md:px-4">
      <MobileSectionHeader
        title={title}
        subtitle={subtitle}
        href="/products"
        linkLabel={t("viewAll")}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {displayProducts.map((p, index) => (
          <div key={p._id} className="flex flex-col">
            <CatalogProductCard
              id={p._id}
              name={p.name}
              image={p.image}
              price={p.price}
              category={p.category}
              priority={index === 0}
            />
            {quickAddFooter(p)}
          </div>
        ))}
      </div>
    </section>
  );
}
