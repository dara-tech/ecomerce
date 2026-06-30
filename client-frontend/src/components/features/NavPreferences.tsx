"use client";

import { Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { LOCALES } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/Label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { code: "USD", label: "USD ($)" },
  { code: "KHR", label: "KHR (៛)" },
  { code: "EUR", label: "EUR (€)" },
];

export function PreferencesPanel({ className }: { className?: string }) {
  const { locale, setLocale, currency, setCurrency } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className={className ?? "space-y-4 p-1"}>
      <div className="space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Language
        </Label>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {LOCALES.map((l) => (
            <Button
              key={l.code}
              type="button"
              variant={locale === l.code ? "default" : "ghost"}
              size="sm"
              className={`flex-1 h-8 rounded-full text-xs font-medium ${
                locale === l.code ? "" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLocale(l.code)}
            >
              {l.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Currency
        </Label>
        <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
          <SelectTrigger className="w-full h-9 text-xs bg-background">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-[100]">
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mounted && (
        <div className="space-y-2">
          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Theme
          </Label>
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 justify-between text-xs font-medium"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            {theme === "dark" ? (
              <Sun className="size-3.5 opacity-70" />
            ) : (
              <Moon className="size-3.5 opacity-70" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function NavPreferences() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground"
            aria-label="Language and display settings"
          >
            <Globe className="size-4" />
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={8} className="w-56 p-3 z-[100]">
        <PreferencesPanel />
      </PopoverContent>
    </Popover>
  );
}
