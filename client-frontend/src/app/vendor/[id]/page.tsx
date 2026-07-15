"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Store as StoreIcon, MessageCircle, MapPin, CalendarDays, ShieldCheck } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import ProductCatalog from "@/components/features/ProductCatalog";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";

type VendorStore = {
  _id: string;
  name: string;
  description: string;
  logo: string;
  status: string;
  createdAt: string;
};

export default function VendorStorePage() {
  const { id } = useParams();
  const router = useRouter();
  const [store, setStore] = useState<VendorStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/stores/public/${id}`);
        if (!res.ok) throw new Error("Store not found");
        const data = await res.json();
        setStore(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load store");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStore();
  }, [id]);

  if (loading) {
    return <PageLoader label="Loading vendor store..." />;
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <StoreIcon className="mb-4 size-12 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Store Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The vendor you're looking for doesn't exist or is currently inactive.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push("/")}>
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-[calc(var(--mobile-tab-bar-h)+2rem)] md:pb-12">
      {/* Store Header Banner */}
      <div className="relative h-32 w-full bg-gradient-to-r from-primary/10 via-primary/5 to-background md:h-48 lg:h-64">
        {/* Placeholder for future banner image */}
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative -mt-12 flex flex-col md:-mt-16 md:flex-row md:items-end md:gap-6 lg:-mt-20">
          
          {/* Logo */}
          <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border-4 border-background bg-muted shadow-md md:size-32 lg:size-40 overflow-hidden">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="size-full object-cover" />
            ) : (
              <StoreIcon className="size-10 text-muted-foreground md:size-16" />
            )}
          </div>
          
          {/* Details */}
          <div className="mt-4 flex flex-1 flex-col justify-between gap-4 md:mt-0 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">{store.name}</h1>
                <ShieldCheck className="size-5 text-emerald-500" />
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {store.description || "Welcome to our store! We offer a wide variety of premium products."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground md:text-sm">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  <span>Joined {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(store.createdAt))}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  <span>Global Shipping</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:shrink-0">
              <Button 
                onClick={() => router.push(`/chat?vendor=${store._id}`)}
                className="gap-2 rounded-full"
                size="lg"
              >
                <MessageCircle className="size-4" />
                Message Vendor
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <h2 className="mb-6 text-xl font-semibold tracking-tight md:text-2xl">Products from {store.name}</h2>
        </div>
      </div>
      
      {/* Product Catalog filtered by this store */}
      <ProductCatalog storeId={store._id} />
    </div>
  );
}
