"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, FolderTree } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  name: string;
  description: string;
  icon?: string;
};

function CategoryThumb({ category }: { category: CategoryItem }) {
  if (category.icon) {
    return (
      <>
        <Image
          src={category.icon}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      </>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-background">
      <div className="absolute inset-0 flex items-center justify-center">
        <FolderTree className="size-16 text-muted-foreground/15 md:size-24" />
      </div>
      <div className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/80 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {category.name.slice(0, 2)}
      </div>
    </div>
  );
}

export default function CategoriesView({ categories }: { categories: CategoryItem[] }) {
  const { t } = useStore();
  const hasImage = (category: CategoryItem) => Boolean(category.icon);

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-6 pt-4 md:py-16">
      <div className="mb-5 md:mb-16 md:text-center">
        <h1 className="text-xl font-bold tracking-tight md:text-5xl">{t("shopByCategory")}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground md:mx-auto md:mt-4 md:text-lg">
          {t("categoriesSubtitle")}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-14 text-center">
          <FolderTree className="mx-auto mb-4 size-12 text-muted-foreground/30" />
          <p className="font-medium text-foreground">{t("categoriesEmpty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("categoriesEmptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {categories.map((category) => {
            const withImage = hasImage(category);
            const description =
              category.description || t("browseCategoryCollection").replace("{name}", category.name);

            return (
              <Link
                key={category._id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group relative flex aspect-[2.15/1] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-transform active:scale-[0.99] sm:aspect-[4/3]"
              >
                <CategoryThumb category={category} />

                <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <h2
                      className={cn(
                        "text-base font-bold leading-tight md:text-2xl",
                        withImage
                          ? "text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]"
                          : "text-foreground"
                      )}
                    >
                      {category.name}
                    </h2>
                    <p
                      className={cn(
                        "mt-1 line-clamp-2 text-xs leading-relaxed md:text-sm",
                        withImage ? "text-white/85" : "text-muted-foreground"
                      )}
                    >
                      {description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-5 shrink-0 md:hidden",
                      withImage ? "text-white/80" : "text-muted-foreground"
                    )}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
