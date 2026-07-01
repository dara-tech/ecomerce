"use client";

import { useEffect, useState } from "react";
import ProductRecRow, { type RecProduct } from "@/components/features/ProductRecRow";
import { useStore } from "@/context/StoreContext";
import { getApiUrl } from "@/lib/api";

export default function ProductRecommendations({
  productId = "home",
  excludeIds = [],
}: {
  productId?: string;
  excludeIds?: string[];
}) {
  const { t } = useStore();
  const [products, setProducts] = useState<RecProduct[]>([]);

  useEffect(() => {
    const apiUrl = getApiUrl();
    const exclude = excludeIds.length
      ? `?exclude=${encodeURIComponent(excludeIds.join(","))}`
      : "";
    const url =
      productId === "home"
        ? `${apiUrl}/customer/recommendations${exclude}`
        : `${apiUrl}/customer/recommendations/${productId}${exclude}`;
    fetch(url)
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [productId, excludeIds.join(",")]);

  return (
    <ProductRecRow
      title={t("recommended")}
      subtitle={t("trendingHint")}
      products={products}
    />
  );
}
