"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Locale, t as translate } from "@/lib/i18n";
import { getApiUrl } from "@/lib/api";

interface StoreSettings {
  storeName: string;
  currency: { default: string; format: string };
  languages: { supported: string[]; default: string };
}

interface StoreContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: string;
  currencySymbol: string;
  setCurrency: (c: string) => void;
  t: (key: string) => string;
  settings: StoreSettings | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrencyState] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale | null;
    const savedCurrency = localStorage.getItem("currency");
    if (savedLocale) setLocaleState(savedLocale);
    if (savedCurrency) setCurrencyState(savedCurrency);

    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/settings/public`)
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        if (!savedCurrency && data.currency?.default) {
          setCurrencyState(data.currency.default);
          setCurrencySymbol(data.currency.format || "$");
        }
        if (!savedLocale && data.languages?.default) {
          setLocaleState(data.languages.default as Locale);
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
    const symbols: Record<string, string> = { USD: "$", EUR: "€", KHR: "៛" };
    setCurrencySymbol(symbols[c] || "$");
  };

  const t = (key: string) => translate(locale, key);

  return (
    <StoreContext.Provider
      value={{ locale, setLocale, currency, currencySymbol, setCurrency, t, settings }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
