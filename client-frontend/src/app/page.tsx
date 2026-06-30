import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import { ArrowRight } from "lucide-react";
import BannerCarousel from "@/components/ui/BannerCarousel";
import HomeClientSections from "@/components/features/HomeClientSections";
import { getApiUrl } from "@/lib/api";

async function getFeaturedProducts() {
  try {
    const apiUrl = getApiUrl();
    // Fetch 8 products for the featured section
    const res = await fetch(`${apiUrl}/products?pageSize=8`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch products');
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
  const activeBanners = banners.filter((b: any) => b.isActive);
  
  return (
    <div className="flex flex-col gap-16 pb-16">
      <BannerCarousel banners={activeBanners} />

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">New Arrivals</h2>
            <p className="text-muted-foreground">The latest additions to our collection.</p>
          </div>
          <Link href="/products" className="text-sm font-medium text-foreground hover:underline underline-offset-4">
            View all
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No products found. Please ensure the backend is running and seeded.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <Link key={product._id} href={`/products/${product._id}`} className="group block hover:-translate-y-1 transition-transform duration-300">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-4">
                  <div className="absolute inset-0 bg-secondary/10 group-hover:bg-transparent transition-colors duration-300 z-10" />
                  <ProductImage 
                    src={product.image} 
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{product.category}</p>
                  <p className="font-semibold">${product.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <HomeClientSections />
    </div>
  );
}
