"use client";

import { ReactNode } from "react";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";
import { GoogleAuthProvider } from "./GoogleAuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import { StoreProvider } from "./StoreContext";
import { WishlistProvider } from "./WishlistContext";
import { CompareProvider } from "./CompareContext";
import { RecentlyViewedProvider } from "./RecentlyViewedContext";
import { ChatProvider } from "./ChatContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AuthProvider>
          <GoogleAuthProvider>
            <ChatProvider>
              <WishlistProvider>
                <CompareProvider>
                  <RecentlyViewedProvider>
                    <CartProvider>{children}</CartProvider>
                  </RecentlyViewedProvider>
                </CompareProvider>
              </WishlistProvider>
            </ChatProvider>
          </GoogleAuthProvider>
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
