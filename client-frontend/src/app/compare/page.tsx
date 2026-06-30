"use client";

import Link from "next/link";
import { GitCompare, Trash2 } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { useStore } from "@/context/StoreContext";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { t } = useStore();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitCompare className="size-8" /> {t("compare")}
        </h1>
        {items.length > 0 && (
          <button type="button" onClick={clear} className="text-sm text-destructive hover:underline">Clear all</button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Add up to 4 products to compare.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium text-muted-foreground w-32">Product</td>
                {items.map((p) => (
                  <td key={p._id} className="p-3 text-center">
                    <Link href={`/products/${p._id}`} className="block relative w-24 h-24 mx-auto rounded-xl overflow-hidden bg-muted mb-2">
                      <ProductImage src={p.image} alt={p.name} fill className="object-cover" sizes="96px" />
                    </Link>
                    <Link href={`/products/${p._id}`} className="text-sm font-medium hover:underline line-clamp-2">{p.name}</Link>
                    <button type="button" onClick={() => remove(p._id)} className="text-xs text-destructive mt-2 inline-flex items-center gap-1">
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium text-muted-foreground">Price</td>
                {items.map((p) => (
                  <td key={p._id} className="p-3 text-center font-semibold"><PriceDisplay amount={p.price} /></td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Category</td>
                {items.map((p) => (
                  <td key={p._id} className="p-3 text-center text-sm text-muted-foreground">{p.category || '—'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
