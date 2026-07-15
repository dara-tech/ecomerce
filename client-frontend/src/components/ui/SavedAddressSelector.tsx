"use client";

import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Address {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Props {
  addresses: Address[];
  onSelect: (address: Address) => void;
  selectedId?: string;
}

export default function SavedAddressSelector({ addresses, onSelect, selectedId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!addresses || addresses.length === 0) return null;

  const handleSelect = (addr: Address) => {
    onSelect(addr);
    setIsOpen(false);
  };

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          Saved Addresses
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {isOpen ? "Hide" : "Show Saved Addresses"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <button
              key={addr._id}
              type="button"
              onClick={() => handleSelect(addr)}
              className={cn(
                "relative flex flex-col items-start rounded-xl border p-3 text-left transition-all hover:border-primary/50",
                selectedId === addr._id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/60 bg-background"
              )}
            >
              {selectedId === addr._id && (
                <div className="absolute right-3 top-3 text-primary">
                  <Check className="size-4" />
                </div>
              )}
              <span className="font-semibold text-sm">
                {addr.firstName} {addr.lastName}
              </span>
              <span className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {addr.address}, {addr.city}, {addr.state} {addr.zipCode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
