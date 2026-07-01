"use client";

import Link from "next/link";
import { FolderTree, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  name: string;
  icon?: string;
};

export default function CategorySidebar({
  categories,
  activeCategory,
}: {
  categories: CategoryItem[];
  activeCategory?: string;
}) {
  const allActive = !activeCategory;

  return (
    <>
      {/* Desktop: collapsed rail, expands on hover */}
      <aside
        className={cn(
          "group/sidebar hidden lg:block shrink-0",
          "w-14 hover:w-52 transition-[width] duration-300 ease-out overflow-hidden"
        )}
      >
        <nav
          className="sticky top-24 border border-border/60 rounded-xl bg-card/80 backdrop-blur-sm shadow-sm"
          aria-label="Product categories"
        >
          <div className="py-3">
            <p
              className={cn(
                "px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                "opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200",
                "whitespace-nowrap overflow-hidden"
              )}
            >
              Categories
            </p>

            <Link
              href="/products"
              title="All products"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-muted/80",
                allActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                <LayoutGrid className="size-4" />
              </span>
              <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                All products
              </span>
            </Link>

            {categories.map((category) => {
              const active = activeCategory === category.name;
              return (
                <Link
                  key={category._id}
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  title={category.name}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-muted/80",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 overflow-hidden">
                    {category.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.icon}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <FolderTree className="size-4" />
                    )}
                  </span>
                  <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Mobile / tablet: horizontal strip */}
      <div className="lg:hidden -mx-1 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-1 pb-1 min-w-min">
          <Link
            href="/products"
            className={cn(
              "shrink-0 inline-flex items-center h-9 px-4 rounded-full text-xs font-medium border transition-colors",
              allActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {categories.map((category) => {
            const active = activeCategory === category.name;
            return (
              <Link
                key={category._id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className={cn(
                  "shrink-0 inline-flex items-center h-9 px-4 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
