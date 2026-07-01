"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SectionLoader, InlineLoader } from "@/components/ui/PageLoader";
import { CatalogProductCard } from "@/components/ui/MobileProductCard";
import {
  DesktopCategoryNav,
  MobileCategoryBar,
  type CategoryItem,
} from "@/components/features/CategorySidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/context/StoreContext";
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

type SortValue = "featured" | "price-asc" | "price-desc" | "newest";

type Product = {
  _id: string;
  name: string;
  image: string;
  category: string;
  price: number;
};

const sortSelectClass =
  "flex h-10 w-full min-w-0 items-center justify-between rounded-full border border-border/60 bg-muted/40 px-4 text-sm font-medium shadow-none focus-visible:ring-2 focus-visible:ring-foreground/10 md:h-9 md:w-[180px] md:rounded-lg md:bg-background";

function CatalogSort({
  sort,
  onSortChange,
  labels,
}: {
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  labels: Record<SortValue, string>;
}) {
  return (
    <Select value={sort} onValueChange={(v) => onSortChange(v as SortValue)}>
      <SelectTrigger className={sortSelectClass}>
        <SelectValue placeholder={labels.featured} />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(labels) as SortValue[]).map((value) => (
          <SelectItem key={value} value={value}>
            {labels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ProductCatalog({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") ?? undefined;
  const activeCategory = categoryFromUrl ?? initialCategory;
  const { t } = useStore();

  const sortLabels = useMemo(
    () => ({
      featured: t("sortFeatured"),
      "price-asc": t("sortPriceAsc"),
      "price-desc": t("sortPriceDesc"),
      newest: t("sortNewest"),
    }),
    [t]
  );

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortValue>("featured");

  const fetchPage = useCallback(
    async (pageNumber: number, append: boolean) => {
      const apiUrl = getApiUrl();
      const params = new URLSearchParams({
        pageSize: String(PAGE_SIZE),
        pageNumber: String(pageNumber),
      });
      if (activeCategory) params.set("category", activeCategory);
      if (sort === "price-asc") params.set("sort", "price-asc");
      if (sort === "price-desc") params.set("sort", "price-desc");
      if (sort === "newest") params.set("sort", "newest");

      const res = await fetch(`${apiUrl}/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const items: Product[] = data.products || [];

      setProducts((prev) => (append ? [...prev, ...items] : items));
      setTotal(data.total ?? 0);
      setPage(pageNumber);
      setHasMore(pageNumber < (data.pages ?? 1));
    },
    [activeCategory, sort]
  );

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setCategories(
          (data || []).filter((c: CategoryItem & { isActive?: boolean }) => c.isActive !== false)
        )
      )
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetchPage(1, false)
      .catch(() => {
        setProducts([]);
        setTotal(0);
        setHasMore(false);
        setFetchError(t("productsFetchError"));
      })
      .finally(() => setLoading(false));
  }, [fetchPage, t]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } catch {
      /* keep current list */
    } finally {
      setLoadingMore(false);
    }
  };

  const pageTitle = activeCategory ? activeCategory : t("allProducts");

  return (
    <>
      <MobileCategoryBar categories={categories} activeCategory={activeCategory} />

      <div className="border-b border-border/60 bg-background px-4 py-3 lg:hidden">
        <CatalogSort sort={sort} onSortChange={setSort} labels={sortLabels} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-6 pt-3 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <DesktopCategoryNav categories={categories} activeCategory={activeCategory} />

          <div className="min-w-0 flex-1">
            <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("showingResults")
                    .replace("{current}", String(products.length))
                    .replace("{total}", String(total))}
                </p>
              </div>
              <CatalogSort sort={sort} onSortChange={setSort} labels={sortLabels} />
            </div>

            {loading ? (
              <SectionLoader label="Loading products…" />
            ) : fetchError ? (
              <div className="space-y-4 py-16 text-center">
                <p className="text-sm text-muted-foreground">{fetchError}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-6"
                  onClick={() => {
                    setLoading(true);
                    setFetchError(null);
                    fetchPage(1, false)
                      .catch(() => setFetchError(t("productsFetchError")))
                      .finally(() => setLoading(false));
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card px-6 py-14 text-center text-sm text-muted-foreground">
                {t("noProductsInCategory")}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-3">
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

                {hasMore && (
                  <div className="mt-6 flex justify-center md:mt-10">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 min-w-[180px] rounded-full px-8 md:h-9 md:rounded-lg",
                        "w-full max-w-sm md:w-auto"
                      )}
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <InlineLoader />
                          Loading…
                        </>
                      ) : (
                        t("loadMore")
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
