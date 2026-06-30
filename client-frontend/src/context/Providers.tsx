"use client";

import { ReactNode } from "react";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";
import { ThemeProvider } from "./ThemeProvider";
import { StoreProvider } from "./StoreContext";
import { WishlistProvider } from "./WishlistContext";
import { CompareProvider } from "./CompareContext";
import { RecentlyViewedProvider } from "./RecentlyViewedContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AuthProvider>
          <WishlistProvider>
            <CompareProvider>
              <RecentlyViewedProvider>
                <CartProvider>{children}</CartProvider>
              </RecentlyViewedProvider>
            </CompareProvider>
          </WishlistProvider>
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
