import BannerCarousel from "@/components/ui/BannerCarousel";
import HomeClientSections from "@/components/features/HomeClientSections";
import HomeFeaturedSection from "@/components/features/HomeFeaturedSection";
import { getApiUrl } from "@/lib/api";

async function getFeaturedProducts() {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/products?pageSize=8`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return { products: [] };
  }
}

async function getBanners() {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/cms/banners`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const { products } = await getFeaturedProducts();
  const banners = await getBanners();
  const activeBanners = banners.filter((b: { isActive?: boolean }) => b.isActive);

  return (
    <div className="flex flex-col gap-8 pb-6 md:gap-16 md:pb-16">
      <BannerCarousel banners={activeBanners} />
      <HomeFeaturedSection products={products} />
      <HomeClientSections />
    </div>
  );
}
