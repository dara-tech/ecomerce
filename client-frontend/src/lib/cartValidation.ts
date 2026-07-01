import { getApiUrl } from "@/lib/api";
import type { CartItem } from "@/context/CartContext";

export type CartValidationResult = {
  valid: boolean;
  items: CartItem[];
  removed: { _id?: string; name: string; reason: string }[];
};

export async function validateCartItems(
  items: Pick<CartItem, "_id" | "name" | "qty">[]
): Promise<CartValidationResult | null> {
  if (!items.length) {
    return { valid: true, items: [], removed: [] };
  }

  try {
    const res = await fetch(`${getApiUrl()}/store/cart/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ _id: i._id, name: i.name, qty: i.qty })),
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function formatRemovedCartMessage(
  removed: CartValidationResult["removed"]
): string {
  if (!removed.length) return "";
  const names = removed.map((r) => `"${r.name}"`).join(", ");
  return `${names} ${removed.length === 1 ? "is" : "are"} no longer available and ${removed.length === 1 ? "was" : "were"} removed from your cart.`;
}
