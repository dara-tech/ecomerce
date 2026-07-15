"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  registerSessionHandlers,
  clearSessionHandlers,
  validateStoredSession,
} from "@/lib/authSession";

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin: boolean;
  token: string;
  avatar?: string;
  refreshToken?: string;
  addresses?: any[];
}


interface AuthContextType {
  user: User | null;
  isInitialized: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearStoredAuth() {
  localStorage.removeItem("userInfo");
  localStorage.removeItem("refreshToken");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const bootstrappingRef = useRef(true);

  const logout = useCallback(() => {
    setUser(null);
    clearStoredAuth();
    router.push("/login");
  }, [router]);

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    if (userData.refreshToken) {
      localStorage.setItem("refreshToken", userData.refreshToken);
    }
  }, []);

  useEffect(() => {
    registerSessionHandlers({
      onExpired: () => {
        setUser(null);
        clearStoredAuth();
        if (bootstrappingRef.current) return;
        toast.error("Session expired. Please sign in again.");
        router.push("/login");
      },
      onRefreshed: (nextUser) => setUser(nextUser),
    });

    return () => clearSessionHandlers();
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let status: "valid" | "refreshed" | "expired" | "none" = "none";
      try {
        status = await validateStoredSession();
      } catch (err) {
        console.warn("Auth validation network error, falling back to local session", err);
        status = "valid";
      }
      if (cancelled) return;

      if (status === "none" || status === "expired") {
        setUser(null);
        clearStoredAuth();
      } else {
        const updated = localStorage.getItem("userInfo");
        if (updated) {
          try {
            setUser(JSON.parse(updated));
          } catch {
            clearStoredAuth();
          }
        }
      }

      bootstrappingRef.current = false;
      setIsInitialized(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
