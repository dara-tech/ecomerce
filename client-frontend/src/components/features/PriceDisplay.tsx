"use client";

import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/formatPrice";

export default function PriceDisplay({ amount }: { amount: number }) {
  const { currency, currencySymbol } = useStore();
  return <>{formatPrice(amount, currency, currencySymbol)}</>;
}
