"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import Footer from "@/components/layout/Footer";
import FlashSaleBar from "@/components/features/FlashSaleBar";
import LiveChat from "@/components/features/LiveChat";
import MarketingPopup from "@/components/features/MarketingPopup";

const AUTH_PREFIXES = ["/login", "/register", "/auth"];
const TAB_BAR_HIDDEN_PREFIXES = ["/login", "/register", "/checkout", "/auth"];

function isAuthRoute(pathname: string) {
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hidesMobileTabBar(pathname: string) {
  return TAB_BAR_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authScreen = isAuthRoute(pathname);
  const chatScreen = pathname === "/chat";
  const noTabBar = hidesMobileTabBar(pathname);

  return (
    <>
      {!authScreen && <FlashSaleBar />}
      {!authScreen && <Navbar />}
      <main
        className={
          authScreen
            ? "flex min-h-0 flex-1 flex-col overflow-hidden md:flex-grow md:overflow-visible"
            : chatScreen
              ? "flex h-[calc(100dvh-var(--mobile-header-h))] min-h-0 flex-col overflow-hidden pb-0 md:h-auto md:grow md:overflow-visible md:pb-0"
              : noTabBar
                ? "flex-grow md:pb-0"
                : "flex-grow pb-[var(--mobile-tab-bar-h)] md:pb-0"
        }
      >
        {children}
      </main>
      {!authScreen && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      {!authScreen && <MobileTabBar />}
      {!authScreen && !chatScreen && <LiveChat />}
      {!authScreen && <MarketingPopup />}
    </>
  );
}
