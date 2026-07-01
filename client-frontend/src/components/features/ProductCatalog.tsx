"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { SectionLoader, InlineLoader } from "@/components/ui/PageLoader";
import ProductImage from "@/components/ui/ProductImage";
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
import { getApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest Arrivals", value: "newest" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Product = {
  _id: string;
  name: string;
  image: string;
  category: string;
  price: number;
};

const toolbarControlBase =
  "!h-9 min-h-9 rounded-lg border !border-input bg-background text-sm shadow-none focus-visible:ring-3 focus-visible:ring-ring/50";
const filterButtonClass = cn(toolbarControlBase, "w-9 shrink-0 p-0");
const sortSelectClass = cn(
  toolbarControlBase,
  "w-full min-w-0 justify-between font-medium lg:w-[180px]"
);

function CatalogFilters({
  sort,
  onSortChange,
}: {
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label="Filters"
        className={filterButtonClass}
      >
        <Filter className="size-4" />
      </Button>
      <div className="min-w-0 flex-1 lg:flex-none lg:min-w-[180px]">
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortValue)}>
          <SelectTrigger className={sortSelectClass}>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
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
        setFetchError(
          "Could not load products. Check your connection or try again in a moment."
        );
      })
      .finally(() => setLoading(false));
  }, [fetchPage]);

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

  return (
    <>
      <MobileCategoryBar categories={categories} activeCategory={activeCategory} />

      <div className="flex items-center gap-2 border-b border-border/60 bg-background px-4 py-3 lg:hidden">
        <CatalogFilters sort={sort} onSortChange={setSort} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-4 pt-4 lg:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <DesktopCategoryNav categories={categories} activeCategory={activeCategory} />

          <div className="min-w-0 flex-1">
            <div className="mb-8 hidden items-center justify-between gap-4 md:flex">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {activeCategory ? `${activeCategory} Products` : "All Products"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Showing {products.length} of {total} results
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <CatalogFilters sort={sort} onSortChange={setSort} />
              </div>
            </div>

          {loading ? (
            <SectionLoader label="Loading products…" />
          ) : fetchError ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-muted-foreground">{fetchError}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setFetchError(null);
                  fetchPage(1, false)
                    .catch(() =>
                      setFetchError(
                        "Could not load products. Check your connection or try again in a moment."
                      )
                    )
                    .finally(() => setLoading(false));
                }}
              >
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No products found in this category.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className="group block hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted mb-4">
                      <div className="absolute inset-0 bg-secondary/10 group-hover:bg-transparent transition-colors duration-300 z-10" />
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        {product.category}
                      </p>
                      <p className="font-semibold">${product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 min-w-[180px] px-8"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <InlineLoader />
                        Loading…
                      </>
                    ) : (
                      "Load more"
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
