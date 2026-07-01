"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { useStore } from "@/context/StoreContext";
import { getApiUrl } from "@/lib/api";
import ProductRecRow, { type RecProduct } from "@/components/features/ProductRecRow";

const FREE_SHIPPING_THRESHOLD = 50;

type CartRecResponse = {
  pairsWell: RecProduct[];
  sameBrand: RecProduct[];
  crossSell: RecProduct[];
  trending: RecProduct[];
};

export default function SmartShopRecommendations() {
  const { cartItems, cartTotal } = useCart();
  const { items: recentlyViewed } = useRecentlyViewed();
  const { t } = useStore();
  const [recs, setRecs] = useState<CartRecResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const cartIds = useMemo(
    () => cartItems.map((i) => i._id).join(","),
    [cartItems]
  );

  useEffect(() => {
    setLoading(true);
    const apiUrl = getApiUrl();
    const params = cartIds ? `?ids=${encodeURIComponent(cartIds)}` : "";
    fetch(`${apiUrl}/customer/recommendations/cart${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRecs(data))
      .catch(() => setRecs(null))
      .finally(() => setLoading(false));
  }, [cartIds]);

  const excludeSet = useMemo(
    () => new Set(cartItems.map((i) => i._id)),
    [cartItems]
  );

  const pickUpWhereLeftOff = recentlyViewed
    .filter((p) => !excludeSet.has(p._id))
    .slice(0, 8)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      image: p.image,
      price: p.price,
      category: p.category,
      countInStock: 99,
    }));

  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const showShippingNudge =
    cartItems.length > 0 && amountToFreeShipping > 0 && amountToFreeShipping <= 30;

  const hasRecSections =
    !!recs &&
    (recs.pairsWell.length > 0 ||
      recs.crossSell.length > 0 ||
      recs.sameBrand.length > 0 ||
      recs.trending.length > 0);

  if (!loading && !hasRecSections && pickUpWhereLeftOff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 mt-12 pt-10 border-t border-border/60">
      {showShippingNudge && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <Truck className="size-5 text-primary shrink-0 mt-0.5" />
          <p>
            {t("freeShippingNudge").replace(
              "{amount}",
              `$${amountToFreeShipping.toFixed(2)}`
            )}
          </p>
        </div>
      )}

      {recs && recs.pairsWell.length > 0 && (
        <ProductRecRow
          title={t("pairsWell")}
          subtitle={t("pairsWellHint")}
          products={recs.pairsWell}
        />
      )}

      {recs && recs.crossSell.length > 0 && (
        <ProductRecRow
          title={t("youMightLike")}
          products={recs.crossSell}
        />
      )}

      {recs && recs.sameBrand.length > 0 && (
        <ProductRecRow
          title={t("moreFromBrand")}
          products={recs.sameBrand}
        />
      )}

      {pickUpWhereLeftOff.length > 0 && (
        <ProductRecRow
          title={t("pickUpWhereLeftOff")}
          products={pickUpWhereLeftOff}
        />
      )}

      {recs && recs.trending.length > 0 && (
        <ProductRecRow
          title={t("trendingNow")}
          subtitle={t("trendingHint")}
          products={recs.trending}
        />
      )}
    </div>
  );
}
