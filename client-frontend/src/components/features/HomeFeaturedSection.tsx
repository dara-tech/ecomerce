"use client";

import { useStore } from "@/context/StoreContext";
import {
  CatalogProductCard,
  MobileSectionHeader,
} from "@/components/ui/MobileProductCard";

type HomeProduct = {
  _id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
};

export default function HomeFeaturedSection({ products }: { products: HomeProduct[] }) {
  const { t } = useStore();

  return (
    <section className="px-4 md:container md:mx-auto md:px-4">
      <MobileSectionHeader
        title={t("newArrivals")}
        subtitle={t("newArrivalsHint")}
        href="/products"
        linkLabel={t("viewAll")}
      />

      {products.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          {t("noProductsHome")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <CatalogProductCard
              key={product._id}
              id={product._id}
              name={product.name}
              image={product.image}
              price={product.price}
              category={product.category}
              priority={index < 2}
            />
          ))}
        </div>
      )}
    </section>
  );
}
