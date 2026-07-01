"use client";

import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ui/ProductImage";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import SmartShopRecommendations from "@/components/features/SmartShopRecommendations";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQty, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything yet.</p>
          <Link href="/products" className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 h-12 rounded-full font-medium hover:bg-foreground/90 transition-all active:scale-95 shadow-sm">
            Continue Shopping
          </Link>
        </div>
        <SmartShopRecommendations />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item._id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-2xl bg-card shadow-sm">
              <Link href={`/products/${item._id}`} className="block relative w-full sm:w-32 h-48 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-muted">
                <ProductImage src={item.image} alt={item.name} fill className="object-cover" />
              </Link>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <Link href={`/products/${item._id}`} className="font-semibold text-lg hover:underline underline-offset-4 line-clamp-1">{item.name}</Link>
                    <p className="text-muted-foreground mt-1">${item.price.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-border/60 rounded-full h-10 w-fit bg-background shadow-sm">
                    <button 
                      onClick={() => updateQty(item._id, Math.max(1, item.qty - 1))}
                      className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-l-full"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium select-none">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item._id, Math.min(item.countInStock, item.qty + 1))}
                      className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-r-full"
                      disabled={item.qty >= item.countInStock}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="font-bold text-lg">
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-2xl p-6 bg-card sticky top-24 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <Link 
              href="/checkout"
              className="flex items-center justify-center w-full bg-foreground text-background h-12 rounded-full font-bold text-base hover:bg-foreground/90 transition-all active:scale-95 shadow-lg shadow-foreground/10"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>

      <SmartShopRecommendations />
    </div>
  );
}
