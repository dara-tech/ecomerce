"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

export interface CartItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  countInStock: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart items:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i._id === item._id);
      if (existingItem) {
        return prev.map((i) => 
          i._id === item._id 
            ? { ...i, qty: Math.min(i.qty + item.qty, item.countInStock) } 
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setCartItems((prev) => 
      prev.map((i) => (i._id === id ? { ...i, qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const value = useMemo(
    () => ({ cartItems, addToCart, removeFromCart, updateQty, clearCart, cartTotal }),
    [cartItems, addToCart, removeFromCart, updateQty, clearCart, cartTotal]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
