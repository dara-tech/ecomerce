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

const MOBILE_HEADER_SELECTOR = "[data-mobile-header]";

function useMobileHeaderOffset() {
  const [topPx, setTopPx] = useState<number | null>(null);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(MOBILE_HEADER_SELECTOR);
    if (!header) return;

    const sync = () => setTopPx(header.getBoundingClientRect().height);
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(header);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return topPx;
}

const MOBILE_CHIP_BASE =
  "snap-start shrink-0 inline-flex items-center h-9 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap";

function chipClass(active: boolean, withIcon = false) {
  return cn(
    MOBILE_CHIP_BASE,
    withIcon ? "gap-2 pl-1.5 pr-4" : "px-4",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border/50 bg-muted text-muted-foreground hover:text-foreground"
  );
}

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
    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {category.name.slice(0, 2)}
    </span>
  );
}

function CategoryIconBadge({
  category,
  active,
}: {
  category: CategoryItem;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full",
        active ? "bg-background/20" : "bg-background"
      )}
    >
      <CategoryIcon category={category} />
    </span>
  );
}

/** Full-width sticky category chips — render outside the page container on mobile. */
export function MobileCategoryBar({
  categories,
  activeCategory,
}: {
  categories: CategoryItem[];
  activeCategory?: string;
}) {
  const allActive = !activeCategory;
  const headerOffset = useMobileHeaderOffset();

  return (
    <section
      className="sticky top-[calc(max(0.5rem,env(safe-area-inset-top,0px))+3.5rem)] z-40 border-b border-border/60 bg-background lg:hidden"
      style={headerOffset != null ? { top: `${headerOffset}px` } : undefined}
      aria-label="Product categories"
    >
      <div className="px-4 py-3">
        <div className="-mx-4 px-4">
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            <Link href="/products" className={chipClass(allActive)}>
              All
            </Link>
            {categories.map((category) => {
              const active = activeCategory === category.name;
              return (
                <Link
                  key={category._id}
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  className={chipClass(active, true)}
                >
                  <CategoryIconBadge category={category} active={active} />
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Desktop sidebar — use inside the catalog layout row. */
export function DesktopCategoryNav({
  categories,
  activeCategory,
}: {
  categories: CategoryItem[];
  activeCategory?: string;
}) {
  const allActive = !activeCategory;

  return (
    <aside className="hidden w-full shrink-0 lg:block lg:w-56 xl:w-60">
      <nav
        className="sticky top-24 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
        aria-label="Product categories"
      >
        <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </h2>
        </div>
        <div className="no-scrollbar max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto p-2">
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
  );
}

export default function CategorySidebar({
  categories,
  activeCategory,
}: {
  categories: CategoryItem[];
  activeCategory?: string;
}) {
  return (
    <>
      <MobileCategoryBar categories={categories} activeCategory={activeCategory} />
      <DesktopCategoryNav categories={categories} activeCategory={activeCategory} />
    </>
  );
}
