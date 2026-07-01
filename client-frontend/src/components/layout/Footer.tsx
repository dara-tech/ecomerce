"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { resolveShopLink } from "@/lib/shopLinks";

const Footer = () => {
  const { settings } = useStore();
  const storeName = settings?.storeName || "Store";

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg tracking-tight uppercase">{storeName}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Minimalist, advanced, and ready for all screens. We provide the best products with top-tier quality.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link href={resolveShopLink("/categories/new")} className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link href={resolveShopLink("/categories/sale")} className="hover:text-foreground transition-colors">Sale</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support & Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
