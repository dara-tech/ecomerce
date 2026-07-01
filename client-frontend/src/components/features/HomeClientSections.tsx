"use client";

import RecentlyViewedSection from "@/components/features/RecentlyViewedSection";
import ProductRecommendations from "@/components/features/ProductRecommendations";

/** Client-only home sections that depend on browser context / localStorage. */
export default function HomeClientSections() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <RecentlyViewedSection />
      <div className="md:container md:mx-auto md:px-4">
        <ProductRecommendations />
      </div>
    </div>
  );
}
