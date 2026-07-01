"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, FolderTree, ShoppingBag, User, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

const HIDDEN_PREFIXES = ["/login", "/register", "/checkout", "/auth"];

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function MobileTabBar() {
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { t } = useStore();

  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const accountPath = user ? "/profile" : "/login";

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  const tabs = [
    { href: "/", label: t("home"), icon: Home, match: (p: string) => p === "/" },
    { href: "/products", label: t("products"), icon: LayoutGrid, match: (p: string) => p.startsWith("/products") },
    { href: "/categories", label: t("categories"), icon: FolderTree, match: (p: string) => p.startsWith("/categories") },
    { href: "/chat", label: t("chat"), icon: MessageCircle, match: (p: string) => p === "/chat" },
    { href: "/cart", label: t("cart"), icon: ShoppingBag, match: (p: string) => p === "/cart", badge: cartCount },
    { href: accountPath, label: user ? t("account") : t("signIn"), icon: User, match: (p: string) =>
      p === accountPath || p.startsWith("/profile") || p.startsWith("/orders") || p.startsWith("/wallet"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background md:hidden"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-[var(--mobile-tab-bar-content-h)] max-w-lg items-center justify-around gap-0.5 px-2 sm:gap-1 sm:px-4">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-colors active:scale-95 sm:gap-1.5 sm:px-2 sm:py-2.5 ${
                active ? "bg-muted/90 text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="relative flex h-6 w-6 items-center justify-center sm:h-7 sm:w-7">
                <Icon className={`size-5 sm:size-[22px] ${active ? "stroke-[2.25px]" : "stroke-[1.75px]"}`} />
                {tab.badge != null && <TabBadge count={tab.badge} />}
              </span>
              <span className={`max-w-full truncate px-0.5 text-[9px] leading-tight sm:text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
