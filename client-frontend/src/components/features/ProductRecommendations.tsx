"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "./PriceDisplay";
import { useStore } from "@/context/StoreContext";
import { getApiUrl } from "@/lib/api";

export default function ProductRecommendations({ productId = "home" }: { productId?: string }) {
  const { t } = useStore();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = getApiUrl();
    const url = productId === "home"
      ? `${apiUrl}/customer/recommendations`
      : `${apiUrl}/customer/recommendations/${productId}`;
    fetch(url)
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [productId]);

  if (!products.length) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">{t("recommended")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link key={p._id} href={`/products/${p._id}`} className="group">
            <div className="aspect-square rounded-xl bg-muted overflow-hidden mb-2 relative">
              <ProductImage src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="200px" />
            </div>
            <p className="text-sm font-medium line-clamp-1">{p.name}</p>
            <p className="text-sm font-semibold"><PriceDisplay amount={p.price} /></p>
          </Link>
        ))}
      </div>
    </section>
  );
}
