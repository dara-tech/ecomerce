"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Store as StoreIcon, ShieldCheck, MapPin } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { CatalogProductCard } from "@/components/ui/MobileProductCard";
import { PageLoader } from "@/components/ui/PageLoader";

type StoreData = {
  _id: string;
  name: string;
  description: string;
  logo: string;
  status: string;
  createdAt: string;
};

type Product = {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  countInStock: number;
  store?: { _id: string; name: string };
};

export default function StoreProfilePage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch Store Profile
        const storeRes = await fetch(`${getApiUrl()}/store/public/${storeId}`);
        if (!storeRes.ok) {
          throw new Error("Store not found");
        }
        const storeData = await storeRes.json();
        setStore(storeData);

        // Fetch Products for this store
        const prodRes = await fetch(`${getApiUrl()}/products?store=${storeId}&pageSize=50`);
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      } catch {
        setError("Failed to load store profile.");
      } finally {
        setLoading(false);
      }
    }
    
    if (storeId) {
      fetchData();
    }
  }, [storeId]);

  if (loading) return <PageLoader />;
  if (error || !store) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-muted/50 items-center justify-center mb-4">
          <StoreIcon className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Store Not Found</h1>
        <p className="text-muted-foreground mt-2">This store may have been removed or suspended.</p>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-24">
      {/* Store Banner */}
      <div className="relative h-48 md:h-64 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container mx-auto px-4 md:px-12 pb-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-2xl relative">
            {/* Store Logo floating over banner */}
            <div className="relative -mt-12 md:-mt-16 mb-4 w-24 h-24 md:w-32 md:h-32 bg-background border-4 border-background rounded-full overflow-hidden shadow-xl z-10 flex shrink-0">
              {store.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo} alt={store.name} className="size-full object-cover bg-muted" />
              ) : (
                <div className="size-full bg-muted flex items-center justify-center">
                  <StoreIcon className="size-10 md:size-12 text-muted-foreground/50" />
                </div>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2 mt-2">
              {store.name}
              {store.status === "active" && (
                <ShieldCheck className="size-6 text-blue-500" aria-label="Verified Store" />
              )}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="size-4" /> Global Seller</span>
              <span className="hidden sm:inline">&bull;</span>
              <span>Joined {new Date(store.createdAt).getFullYear()}</span>
            </div>
            {store.description && (
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {store.description}
              </p>
            )}
          </div>
          
          <div className="shrink-0 flex gap-3 md:pt-6">
            <button className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
              Follow Store
            </button>
          </div>
        </div>

        <hr className="my-10 border-border/60" />

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">All Products ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border/60 rounded-2xl bg-muted/20">
            <StoreIcon className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium text-foreground">No products yet</p>
            <p className="text-sm text-muted-foreground">This store hasn&apos;t listed any items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {products.map((product) => (
              <CatalogProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                image={product.image}
                price={product.price}
                category={product.category}
                countInStock={product.countInStock}
                store={store}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
