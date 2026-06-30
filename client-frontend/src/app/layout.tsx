import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Providers } from "@/context/Providers";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Modern E-Commerce',
    default: 'Modern E-Commerce | Premium Tech Essentials',
  },
  description: 'Advanced, minimalist shopping experience offering curated premium tech essentials, accessories, and gadgets.',
  keywords: ['e-commerce', 'tech', 'gadgets', 'accessories', 'premium', 'minimalist'],
  authors: [{ name: 'Modern E-Commerce' }],
  openGraph: {
    title: 'Modern E-Commerce | Premium Tech Essentials',
    description: 'Advanced, minimalist shopping experience offering curated premium tech essentials, accessories, and gadgets.',
    url: 'https://modern-e-commerce.com',
    siteName: 'Modern E-Commerce',
    images: [
      {
        url: 'https://placehold.co/1200x630/1d1b1c/ffffff?text=Modern+E-Commerce',
        width: 1200,
        height: 630,
        alt: 'Modern E-Commerce Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Modern E-Commerce',
    description: 'Advanced, minimalist shopping experience.',
    images: ['https://placehold.co/1200x630/1d1b1c/ffffff?text=Modern+E-Commerce'],
  },
};

import { Toaster } from 'sonner';
import LiveChat from '@/components/features/LiveChat';
import MarketingPopup from '@/components/features/MarketingPopup';
import FlashSaleBar from '@/components/features/FlashSaleBar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${googleSans.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <FlashSaleBar />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <LiveChat />
          <MarketingPopup />
        </Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
