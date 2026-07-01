"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  name: string;
  icon?: string;
};

function CategoryLink({
  href,
  active,
  icon,
  label,
  className,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-foreground text-background font-medium shadow-sm"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        className
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md overflow-hidden",
          active ? "bg-background/15" : "bg-muted/80"
        )}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {!active && (
        <ChevronRight className="size-4 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-40 group-hover:translate-x-0" />
      )}
    </Link>
  );
}

function CategoryIcon({ category }: { category: CategoryItem }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [category.icon]);

  if (category.icon && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={category.icon}
        alt=""
        className="size-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="text-xs font-bold uppercase tracking-wide opacity-70">
      {category.name.slice(0, 2)}
    </span>
  );
}

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
      {/* Mobile: full-width sticky bar (sibling in flex-col stacks above products) */}
      <div className="lg:hidden w-full -mx-4 px-4 sticky top-[4.5rem] z-30 py-3 mb-1 bg-background/95 backdrop-blur-md border-b border-border/60">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Browse by category
        </p>
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 snap-x snap-mandatory">
            <Link
              href="/products"
              className={cn(
                "snap-start shrink-0 inline-flex items-center h-9 px-4 rounded-full text-xs font-semibold border transition-colors",
                allActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
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
                    "snap-start shrink-0 inline-flex items-center gap-2 h-9 pl-1.5 pr-4 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex size-6 items-center justify-center rounded-full overflow-hidden bg-background/80 shrink-0">
                    <CategoryIcon category={category} />
                  </span>
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-full lg:w-56 xl:w-60 shrink-0">
        <nav
          className="sticky top-24 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden"
          aria-label="Product categories"
        >
          <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </h2>
          </div>
          <div className="p-2 space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
            <CategoryLink
              href="/products"
              active={allActive}
              label="All products"
              icon={<LayoutGrid className="size-4" />}
            />
            {categories.map((category) => (
              <CategoryLink
                key={category._id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                active={activeCategory === category.name}
                label={category.name}
                icon={<CategoryIcon category={category} />}
              />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
