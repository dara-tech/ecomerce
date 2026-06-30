"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";

export interface WishlistProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
}

interface WishlistContextType {
  items: WishlistProduct[];
  add: (product: WishlistProduct) => void;
  remove: (id: string) => void;
  toggle: (product: WishlistProduct) => void;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const STORAGE_KEY = "wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";

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

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${apiUrl}/customer/wishlist`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length) setItems(data);
      })
      .catch(() => {});
  }, [user?.token, apiUrl]);

  const persist = useCallback((next: WishlistProduct[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const syncAdd = (productId: string) => {
    if (!user?.token) return;
    fetch(`${apiUrl}/customer/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ productId }),
    }).catch(() => {});
  };

  const syncRemove = (productId: string) => {
    if (!user?.token) return;
    fetch(`${apiUrl}/customer/wishlist/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` },
    }).catch(() => {});
  };

  const add = (product: WishlistProduct) => {
    if (items.some((i) => i._id === product._id)) return;
    persist([...items, product]);
    syncAdd(product._id);
  };

  const remove = (id: string) => {
    persist(items.filter((i) => i._id !== id));
    syncRemove(id);
  };

  const toggle = (product: WishlistProduct) => {
    if (items.some((i) => i._id === product._id)) remove(product._id);
    else add(product);
  };

  const isInWishlist = (id: string) => items.some((i) => i._id === id);

  return (
    <WishlistContext.Provider value={{ items, add, remove, toggle, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
