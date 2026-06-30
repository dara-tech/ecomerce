"use client";

import RecentlyViewedSection from "@/components/features/RecentlyViewedSection";
import ProductRecommendations from "@/components/features/ProductRecommendations";

/** Client-only home sections that depend on browser context / localStorage. */
export default function HomeClientSections() {
  return (
    <>
      <RecentlyViewedSection />
      <div className="container mx-auto px-4">
        <ProductRecommendations />
      </div>
    </>
  );
}
