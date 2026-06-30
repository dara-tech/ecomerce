"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BannerCarousel({ banners }: { banners: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return (
      <section className="relative w-full bg-muted/30 pt-24 pb-32 overflow-hidden border-b min-h-[500px] flex items-center justify-center">
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <header>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 max-w-4xl text-foreground drop-shadow-sm">
              The New Standard in Tech Essentials.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed mx-auto drop-shadow-sm">
              Minimalist design meets uncompromising performance. Discover our curated collection of premium accessories and gadgets.
            </p>
          </header>
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background font-medium px-8 h-12 rounded-full hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            Shop Collection
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </section>
    );
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  const activeBanner = banners[currentIndex];

  return (
    <section className="relative w-full bg-muted/30 pt-24 pb-32 overflow-hidden border-b min-h-[500px] flex items-center justify-center group">
      {activeBanner.image && (
        <div className="absolute inset-0 z-0 opacity-40 transition-opacity duration-1000 ease-in-out">
          <img src={activeBanner.image} alt={activeBanner.title} className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000" key={activeBanner._id} />
        </div>
      )}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        <header key={activeBanner._id + '-text'} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 max-w-4xl text-foreground drop-shadow-md">
            {activeBanner.title}
          </h1>
        </header>
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <Link 
            href={activeBanner.linkUrl || "/products"} 
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background font-medium px-8 h-12 rounded-full hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Shop Collection
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      {/* Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center border border-border/50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center border border-border/50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm"
          >
            <ChevronRight className="size-5" />
          </button>
          
          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-6 h-2 bg-foreground' : 'w-2 h-2 bg-foreground/30 hover:bg-foreground/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
