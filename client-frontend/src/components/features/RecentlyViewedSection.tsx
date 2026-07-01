"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useStore } from "@/context/StoreContext";
import MobileProductCard, {
  MobileProductRail,
  MobileSectionHeader,
} from "@/components/ui/MobileProductCard";

export default function RecentlyViewedSection() {
  const [mounted, setMounted] = useState(false);
  const { items } = useRecentlyViewed();
  const { t } = useStore();

  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return (
    <section className="md:container md:mx-auto md:px-4">
      <MobileSectionHeader title={t("recentlyViewed")} href="/products" />
      <MobileProductRail>
        {items.map((p) => (
          <MobileProductCard
            key={p._id}
            id={p._id}
            name={p.name}
            image={p.image}
            price={p.price}
            category={p.category}
          />
        ))}
      </MobileProductRail>

      <div className="hidden gap-6 md:grid md:grid-cols-4 lg:grid-cols-6">
        {items.map((p) => (
          <Link key={`desktop-${p._id}`} href={`/products/${p._id}`} className="group block">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-muted">
              <ProductImage
                src={p.image}
                alt={p.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="176px"
              />
            </div>
            <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{p.name}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              <PriceDisplay amount={p.price} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
