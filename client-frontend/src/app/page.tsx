import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import BannerCarousel from "@/components/ui/BannerCarousel";
import HomeClientSections from "@/components/features/HomeClientSections";
import MobileProductCard, {
  MobileProductRail,
  MobileSectionHeader,
} from "@/components/ui/MobileProductCard";
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
  const activeBanners = banners.filter((b: any) => b.isActive);

  return (
    <div className="flex flex-col gap-10 pb-6 md:gap-16 md:pb-16">
      <BannerCarousel banners={activeBanners} />

      <section className="md:container md:mx-auto md:px-4">
        <MobileSectionHeader
          title="New Arrivals"
          subtitle="The latest additions to our collection."
          href="/products"
        />

        {products.length === 0 ? (
          <div className="px-4 py-16 text-center text-muted-foreground md:px-0 md:py-20">
            No products found. Please ensure the backend is running and seeded.
          </div>
        ) : (
          <>
            <MobileProductRail>
              {products.map((product: any, index: number) => (
                <MobileProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  image={product.image}
                  price={product.price}
                  category={product.category}
                  priority={index === 0}
                />
              ))}
            </MobileProductRail>

            <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
              {products.map((product: any, index: number) => (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  className="group block transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-muted">
                    <div className="absolute inset-0 z-10 bg-secondary/10 transition-colors duration-300 group-hover:bg-transparent" />
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      fill
                      priority={index === 0}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="flex min-h-[4.5rem] flex-col">
                    <h3 className="line-clamp-2 h-10 font-medium leading-5 text-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 h-4 truncate text-sm text-muted-foreground">{product.category}</p>
                    <p className="mt-auto pt-1 font-semibold tabular-nums">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <HomeClientSections />
    </div>
  );
}
