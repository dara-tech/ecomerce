"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, LogOut, Package, Wallet, Star } from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Basic protection: if not logged in, redirect to login
    if (user === null) {
      // If we know definitely there's no user, redirect
      // Wait for hydration/initialization slightly handled by context normally
      const storedUser = localStorage.getItem("userInfo");
      if (!storedUser) {
        router.push("/login");
      }
    }
  }, [user, router]);

  if (!user) {
    return <PageLoader label="Loading profile…" />;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
        
        <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t">
              <Link href="/orders" className="flex items-center gap-4 p-4 rounded-xl border hover:border-foreground/50 transition-colors group">
                <div className="bg-muted p-3 rounded-lg group-hover:bg-foreground/5 transition-colors">
                  <Package className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">My Orders</h3>
                  <p className="text-sm text-muted-foreground">View order history & tracking</p>
                </div>
              </Link>

              <Link href="/wallet" className="flex items-center gap-4 p-4 rounded-xl border hover:border-foreground/50 transition-colors group">
                <div className="bg-muted p-3 rounded-lg group-hover:bg-foreground/5 transition-colors">
                  <Wallet className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Wallet & Loyalty</h3>
                  <p className="text-sm text-muted-foreground">Balance, points & top-up</p>
                </div>
              </Link>

              <Link href="/wishlist" className="flex items-center gap-4 p-4 rounded-xl border hover:border-foreground/50 transition-colors group">
                <div className="bg-muted p-3 rounded-lg group-hover:bg-foreground/5 transition-colors">
                  <Star className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Wishlist</h3>
                  <p className="text-sm text-muted-foreground">Saved products</p>
                </div>
              </Link>
              
              <button onClick={logout} className="flex items-center gap-4 p-4 rounded-xl border hover:border-destructive/50 transition-colors group text-left">
                <div className="bg-destructive/10 p-3 rounded-lg group-hover:bg-destructive/20 transition-colors">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Logout</h3>
                  <p className="text-sm text-muted-foreground">End your session</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
