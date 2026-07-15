"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store as StoreIcon, ShieldCheck } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { PageLoader } from "@/components/ui/PageLoader";

type StoreData = {
  _id: string;
  name: string;
  description: string;
  logo: string;
  createdAt: string;
};

export default function StoresDirectoryPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true);
        const res = await fetch(`${getApiUrl()}/store/public`);
        if (!res.ok) throw new Error("Failed to fetch stores");
        const data = await res.json();
        setStores(data);
      } catch {
        setError("Failed to load stores. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-6 pt-4 md:py-16">
      <div className="mb-5 md:mb-16 md:text-center">
        <h1 className="text-xl font-bold tracking-tight md:text-5xl">Discover Our Sellers</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground md:mx-auto md:mt-4 md:text-lg">
          Explore a wide variety of amazing products from verified independent vendors and boutiques.
        </p>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-14 text-center">
          <StoreIcon className="mx-auto mb-4 size-12 text-muted-foreground/30" />
          <p className="font-medium text-foreground">No stores found</p>
          <p className="mt-1 text-sm text-muted-foreground">No stores have registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 lg:gap-6">
          {stores.map((store) => (
            <Link
              key={store._id}
              href={`/store/${store._id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="relative h-24 bg-muted overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
              </div>
              
              <div className="px-5 pb-5 relative flex-1 flex flex-col">
                <div className="absolute -top-8 left-5 w-16 h-16 rounded-full bg-background border-4 border-background overflow-hidden flex items-center justify-center shadow-sm">
                  {store.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logo} alt={store.name} className="size-full object-cover" />
                  ) : (
                    <StoreIcon className="size-6 text-muted-foreground/50" />
                  )}
                </div>
                
                <div className="mt-10 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-1.5 line-clamp-1">
                    {store.name}
                    <ShieldCheck className="size-4 text-blue-500 shrink-0" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Joined {new Date(store.createdAt).getFullYear()}
                  </p>
                  
                  {store.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                      {store.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic mt-auto">
                      No description provided.
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
