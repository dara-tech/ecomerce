"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { resolveShopLink } from "@/lib/shopLinks";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

type Banner = {
  _id?: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  link?: string;
  image?: string | null;
};

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const { settings } = useStore();
  const storeLabel = settings?.storeName || "Featured";
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const goNext = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (touchDelta.current > 48) goPrev();
    else if (touchDelta.current < -48) goNext();
  };

  const fallback: Banner = {
    title: "The New Standard in Tech Essentials.",
    subtitle:
      "Minimalist design meets uncompromising performance. Discover our curated collection.",
    link: "/products",
    image: null,
  };

  const activeBanner = banners?.length ? banners[currentIndex] : fallback;
  const shopHref = resolveShopLink(activeBanner.linkUrl || activeBanner.link || "/products");
  const hasImage = Boolean(activeBanner.image);

  return (
    <section
      className="relative mx-0 w-full overflow-hidden md:rounded-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative flex min-h-[min(56vh,440px)] flex-col justify-end sm:min-h-[min(62vh,500px)] md:min-h-[500px] md:justify-center">
        {hasImage ? (
          <>
            <img
              key={activeBanner._id || currentIndex}
              src={activeBanner.image!}
              alt={activeBanner.title || "Hero banner"}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover brightness-[0.92] contrast-[1.05] transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20 md:from-black/85 md:via-black/45 md:to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-muted/40">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-background/40 to-muted/60" />
          </div>
        )}

        <div
          className={cn(
            "relative z-10 px-5 pb-10 pt-16 md:container md:mx-auto md:px-4 md:pb-16 md:pt-28",
            hasImage ? "text-left md:text-center" : "text-left md:text-center"
          )}
        >
          <p
            className={cn(
              "mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
              hasImage
                ? "bg-white/15 text-white/90 backdrop-blur-sm"
                : "bg-foreground/5 text-muted-foreground"
            )}
          >
            {storeLabel}
          </p>

          <h1
            key={`title-${currentIndex}`}
            className={cn(
              "max-w-[16ch] animate-in fade-in slide-in-from-bottom-2 text-[1.75rem] font-bold leading-[1.08] tracking-tight duration-500 sm:text-[2rem] md:mx-auto md:max-w-4xl md:text-5xl lg:text-6xl",
              hasImage
                ? "text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]"
                : "text-foreground"
            )}
          >
            {activeBanner.title}
          </h1>

          {activeBanner.subtitle && (
            <p
              className={cn(
                "mt-3 max-w-md text-sm leading-relaxed sm:text-base md:mx-auto md:max-w-2xl",
                hasImage ? "text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]" : "text-muted-foreground"
              )}
            >
              {activeBanner.subtitle}
            </p>
          )}

          <Link
            href={shopHref}
            className={cn(
              "mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold shadow-lg transition-transform active:scale-[0.98] sm:text-base",
              hasImage
                ? "bg-white text-foreground hover:bg-white/95"
                : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            Shop Collection
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5 md:bottom-6">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={currentIndex === idx ? "true" : undefined}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  currentIndex === idx
                    ? cn("h-1.5 w-7", hasImage ? "bg-white" : "bg-foreground")
                    : cn("size-1.5", hasImage ? "bg-white/45" : "bg-foreground/30")
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
