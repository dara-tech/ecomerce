"use client";

import { useStore } from "@/context/StoreContext";
import { LOCALES } from "@/lib/i18n";
import { Globe } from "lucide-react";

const CURRENCIES = [
  { code: "USD", label: "USD $" },
  { code: "KHR", label: "KHR ៛" },
  { code: "EUR", label: "EUR €" },
];

export default function LocaleCurrencySwitcher() {
  const { locale, setLocale, currency, setCurrency } = useStore();

  return (
    <div className="hidden lg:flex items-center gap-1">
      <Globe className="size-3.5 text-muted-foreground ml-1" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as "en" | "km")}
        className="h-8 text-[11px] bg-transparent border-0 text-muted-foreground focus:outline-none cursor-pointer"
        aria-label="Language"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <span className="text-border">|</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="h-8 text-[11px] bg-transparent border-0 text-muted-foreground focus:outline-none cursor-pointer"
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
