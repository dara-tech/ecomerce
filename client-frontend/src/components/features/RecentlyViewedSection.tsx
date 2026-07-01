"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useStore } from "@/context/StoreContext";
import {
  CatalogProductCard,
  MobileSectionHeader,
} from "@/components/ui/MobileProductCard";

export default function RecentlyViewedSection() {
  const [mounted, setMounted] = useState(false);
  const { items } = useRecentlyViewed();
  const { t } = useStore();

  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  const displayItems = items.slice(0, 8);

  return (
    <section className="px-4 md:container md:mx-auto md:px-4">
      <MobileSectionHeader
        title={t("recentlyViewed")}
        href="/products"
        linkLabel={t("viewAll")}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {displayItems.map((p, index) => (
          <CatalogProductCard
            key={p._id}
            id={p._id}
            name={p.name}
            image={p.image}
            price={p.price}
            category={p.category}
            priority={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
