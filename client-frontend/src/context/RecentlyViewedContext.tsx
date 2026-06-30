"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface RecentProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  items: RecentProduct[];
  track: (product: Omit<RecentProduct, "viewedAt">) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);
const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 12;

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const track = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i._id !== product._id);
      const next = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ items, track }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

const defaultRecentlyViewed: RecentlyViewedContextType = {
  items: [],
  track: () => {},
};

export const useRecentlyViewed = () => {
  const ctx = useContext(RecentlyViewedContext);
  return ctx ?? defaultRecentlyViewed;
};
