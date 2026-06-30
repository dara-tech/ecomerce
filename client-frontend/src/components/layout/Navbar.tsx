"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  User,
  LogOut,
  Package,
  FolderTree,
  LayoutDashboard,
  Menu,
  ChevronRight,
  Info,
  BookOpen,
  Heart,
  GitCompare,
  Wallet,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useStore } from "@/context/StoreContext";
import NavPreferences, { PreferencesPanel } from "@/components/features/NavPreferences";
import { useEffect, useRef, useState } from "react";

const pillShell =
  "pointer-events-auto flex h-14 shrink-0 items-center rounded-full border border-border/50 bg-background/80 backdrop-blur-md shadow-sm";

function Badge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-[9px] font-black text-white ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function Navbar() {
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { items: compareItems } = useCompare();
  const { t, settings } = useStore();
  const storeName = settings?.storeName || "Store";
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const NAV_ITEMS = [
    { name: t("home"), path: "/", icon: LayoutDashboard },
    { name: t("products"), path: "/products", icon: Package },
    { name: t("categories"), path: "/categories", icon: FolderTree },
    { name: "Blog", path: "/blog", icon: BookOpen, wideOnly: true },
    { name: "About", path: "/about", icon: Info, wideOnly: true },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userOpen]);

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  const tabClass = (active: boolean) =>
    `inline-flex shrink-0 items-center justify-center gap-1.5 h-9 px-3.5 xl:px-4 text-xs font-medium transition-all rounded-full select-none outline-none ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const iconBtn =
    "relative h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full flex items-center justify-center transition-colors";

  return (
    <div className="sticky top-4 z-50 w-full px-4 mb-6">
      <div className="container mx-auto max-w-7xl relative flex items-center justify-between gap-3 pointer-events-none min-h-14">
        {/* Logo pill */}
        <header className={`${pillShell} px-3 sm:px-4 gap-2 z-10`}>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={storeName}
                className="h-6 max-w-[120px] object-contain"
              />
            ) : (
              <span className="bg-foreground text-background text-xs font-black px-3 py-1 rounded-full tracking-wider uppercase">
                {storeName}
              </span>
            )}
          </Link>
        </header>

        {/* Center nav pill — floating */}
        <nav
          className={`${pillShell} hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5 px-2 z-0 max-w-[min(100%,calc(100%-22rem))]`}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((tab) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`${tabClass(active)} ${tab.wideOnly ? "hidden xl:inline-flex" : ""}`}
              >
                <tab.icon className="size-3.5 shrink-0 opacity-80" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions pill */}
        <div className={`${pillShell} gap-0.5 px-2 sm:px-2.5 z-10`}>
          <NavPreferences />

          <Link href="/wishlist" className={`${iconBtn} hidden sm:flex`} aria-label={t("wishlist")}>
            <Heart className="size-4" />
            <Badge count={wishlistItems.length} className="bg-red-500" />
          </Link>

          <Link href="/compare" className={`${iconBtn} hidden sm:flex`} aria-label={t("compare")}>
            <GitCompare className="size-4" />
            <Badge count={compareItems.length} className="bg-blue-500" />
          </Link>

          <Link href="/cart" className={iconBtn} aria-label={t("cart")}>
            <ShoppingCart className="size-4" />
            <Badge count={cartItemCount} className="bg-primary" />
          </Link>

          <div className="w-px h-5 bg-border/50 mx-0.5 hidden sm:block" />

          <div className="relative hidden sm:flex items-center" ref={userRef}>
            {user ? (
              <>
                <Button
                  type="button"
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2 h-9 rounded-full hover:bg-muted transition-colors"
                  aria-expanded={userOpen ? "true" : "false"}
                >
                  <div className="size-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium max-w-[68px] truncate hidden lg:block">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronRight
                    className={`size-3 text-muted-foreground transition-transform hidden lg:block ${userOpen ? "rotate-90" : ""}`}
                  />
                </Button>
                {userOpen && (
                  <div className="absolute right-0 top-12 min-w-[200px] bg-popover/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl p-1.5 z-50">
                    <p className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-border/50 mb-1">
                      {user.email}
                    </p>
                    <Link
                      href="/profile"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      <User className="size-4 opacity-70" /> My Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      <Package className="size-4 opacity-70" /> {t("orders")}
                    </Link>
                    <Link
                      href="/wallet"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      <Wallet className="size-4 opacity-70" /> {t("wallet")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserOpen(false);
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-destructive/10 text-destructive"
                    >
                      <LogOut className="size-4 opacity-70" /> Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <User className="size-4" />
                <span className="hidden lg:inline">{t("signIn")}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu — floating card */}
        {mobileOpen && (
          <div className="pointer-events-auto absolute top-16 left-0 right-0 md:hidden mt-1 bg-popover/95 backdrop-blur-md border border-border/50 rounded-2xl p-2 shadow-xl space-y-0.5 z-20">
            {NAV_ITEMS.map((tab) => (
              <Link
                key={tab.path}
                href={tab.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive(tab.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="size-5 opacity-70" />
                {tab.name}
              </Link>
            ))}
            <div className="h-px bg-border/50 my-2" />
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted font-medium"
            >
              <Heart className="size-5" /> {t("wishlist")}
              {wishlistItems.length > 0 && (
                <span className="ml-auto text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted font-medium"
            >
              <GitCompare className="size-5" /> {t("compare")}
              {compareItems.length > 0 && (
                <span className="ml-auto text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                  {compareItems.length}
                </span>
              )}
            </Link>
            <div className="px-4 py-3 border-t border-border/50 mt-1">
              <PreferencesPanel className="space-y-4" />
            </div>
            {user ? (
              <>
                <div className="h-px bg-border/50 my-2" />
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted font-medium">
                  <User className="size-5" /> My Profile
                </Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted font-medium">
                  <Package className="size-5" /> {t("orders")}
                </Link>
                <Link href="/wallet" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted font-medium">
                  <Wallet className="size-5" /> {t("wallet")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 font-medium"
                >
                  <LogOut className="size-5" /> Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 mx-2 mt-2 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium"
              >
                <User className="size-4" /> {t("signIn")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
