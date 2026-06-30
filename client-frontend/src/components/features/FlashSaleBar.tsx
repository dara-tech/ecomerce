'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

type FlashSale = {
  _id: string;
  title: string;
  discountPercent: number;
  endsAt: string;
  productIds?: string[];
};

export default function FlashSaleBar() {
  const [sale, setSale] = useState<FlashSale | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api';

  useEffect(() => {
    fetch(`${apiUrl}/marketing/flash-sales/active`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items: FlashSale[]) => {
        if (items?.length) setSale(items[0]);
      })
      .catch(() => {});
  }, [apiUrl]);

  if (!sale) return null;

  const ends = new Date(sale.endsAt);
  const hoursLeft = Math.max(0, Math.round((ends.getTime() - Date.now()) / 3600000));

  return (
    <div className="bg-primary text-primary-foreground text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
      <Zap className="size-4 shrink-0" />
      <span className="font-medium">{sale.title}</span>
      <span className="opacity-90">— {sale.discountPercent}% off</span>
      {hoursLeft > 0 && <span className="opacity-75">· {hoursLeft}h left</span>}
      <Link href="/products" className="underline font-semibold ml-1">
        Shop flash sale
      </Link>
    </div>
  );
}
