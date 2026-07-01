"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import Footer from "@/components/layout/Footer";
import FlashSaleBar from "@/components/features/FlashSaleBar";
import LiveChat from "@/components/features/LiveChat";
import MarketingPopup from "@/components/features/MarketingPopup";

const AUTH_PREFIXES = ["/login", "/register", "/auth"];

function isAuthRoute(pathname: string) {
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authScreen = isAuthRoute(pathname);

  return (
    <>
      {!authScreen && <FlashSaleBar />}
      {!authScreen && <Navbar />}
      <main
        className={
          authScreen
            ? "flex-grow"
            : "flex-grow pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
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
      {!authScreen && <LiveChat />}
      {!authScreen && <MarketingPopup />}
    </>
  );
}
