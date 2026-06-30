"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { WishlistProduct } from "./WishlistContext";

interface CompareContextType {
  items: WishlistProduct[];
  add: (product: WishlistProduct) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  isCompared: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);
const STORAGE_KEY = "compare";
const MAX_COMPARE = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistProduct[]>([]);

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

  const persist = (next: WishlistProduct[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const add = (product: WishlistProduct) => {
    if (items.some((i) => i._id === product._id)) return true;
    if (items.length >= MAX_COMPARE) return false;
    persist([...items, product]);
    return true;
  };

  const remove = (id: string) => persist(items.filter((i) => i._id !== id));
  const clear = () => persist([]);
  const isCompared = (id: string) => items.some((i) => i._id === id);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, isCompared }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
