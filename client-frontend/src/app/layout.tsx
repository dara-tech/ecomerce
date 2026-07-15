import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { Providers } from "@/context/Providers";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${googleSans.variable} font-sans antialiased min-h-screen flex flex-col mobile-app-shell`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
