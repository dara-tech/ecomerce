"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "./PriceDisplay";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useStore } from "@/context/StoreContext";

export default function RecentlyViewedSection() {
  const [mounted, setMounted] = useState(false);
  const { items } = useRecentlyViewed();
  const { t } = useStore();

  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">{t("recentlyViewed")}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {items.map((p) => (
          <Link
            key={p._id}
            href={`/products/${p._id}`}
            className="shrink-0 w-36 snap-start group"
          >
            <div className="aspect-square rounded-xl bg-muted overflow-hidden mb-2 relative">
              <ProductImage src={p.image} alt={p.name} fill className="object-cover" sizes="144px" />
            </div>
            <p className="text-xs font-medium line-clamp-2">{p.name}</p>
            <p className="text-xs font-semibold mt-1"><PriceDisplay amount={p.price} /></p>
          </Link>
        ))}
      </div>
    </section>
  );
}
