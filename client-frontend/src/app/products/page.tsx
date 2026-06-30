import Link from "next/link";
import type { Metadata } from "next";
import ProductImage from "@/components/ui/ProductImage";
import { Filter } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import ProductSortSelect from "@/components/features/ProductSortSelect";

async function getProducts(category?: string) {
  try {
    const apiUrl = getApiUrl();
    let url = `${apiUrl}/products?pageSize=12`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const res = await fetch(url, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], total: 0 };
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  
  return {
    title: category ? `${category} Products` : 'All Products',
    description: `Shop our collection of ${category ? category.toLowerCase() : 'premium tech'} products and accessories.`,
  };
}
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const { products, total } = await getProducts(category);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {category ? `${category} Products` : 'All Products'}
          </h1>
          <p className="text-muted-foreground text-sm">Showing {products.length} of {total} results</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <ProductSortSelect />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No products found. Please ensure the backend is running and seeded.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <Link key={product._id} href={`/products/${product._id}`} className="group block hover:-translate-y-1 transition-transform duration-300">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted mb-4">
                <div className="absolute inset-0 bg-secondary/10 group-hover:bg-transparent transition-colors duration-300 z-10" />
                <ProductImage 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
    </div>
  );
}
