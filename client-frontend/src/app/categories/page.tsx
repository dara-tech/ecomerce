import Link from "next/link";
import Image from "next/image";
import { FolderTree } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  isActive: boolean;
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${getApiUrl()}/categories`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      return [];
    }
    
    const data = await res.json();
    return data.filter((c: Category) => c.isActive);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Shop by Category</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Explore our curated collections. Finding exactly what you need has never been easier or more beautiful.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-3xl border border-border/50">
          <FolderTree className="size-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-medium">No categories available right now.</p>
          <p className="mt-2">Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category._id} href={`/products?category=${category.name}`} className="group relative overflow-hidden rounded-2xl aspect-[4/3] flex items-end p-6 border border-border/50 bg-muted/10 shadow-sm hover:shadow-md transition-all">
              {category.icon ? (
                <>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10" />
                  <Image 
                    src={category.icon} 
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 z-0"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700 z-0">
                  <FolderTree className="size-32" />
                </div>
              )}
              
              <div className="relative z-20 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <h2 className={category.icon ? "text-2xl font-bold text-white mb-2" : "text-2xl font-bold text-foreground mb-2"}>{category.name}</h2>
                <p className={category.icon ? "text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2" : "text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2"}>
                  {category.description || `Browse our collection of ${category.name}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
