"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getApiUrl } from "@/lib/api";

function MockGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  
  const orderId = searchParams.get('order_id');
  const gateway = searchParams.get('gateway');
  const amountStr = searchParams.get('amount') || '0';
  const amount = parseFloat(amountStr).toFixed(2);

  const [isProcessing, setIsProcessing] = useState(false);

  // In a real application, the user would enter their PIN or confirm payment in this UI,
  // and the backend would receive a webhook from the actual bank.
  // Here we simulate the bank sending a webhook back to our backend.
  const handleSimulatePayment = async (status: 'success' | 'failed') => {
    setIsProcessing(true);
    try {
      const apiUrl = getApiUrl();
      // Simulate the webhook being called by the bank
      await fetch(`${apiUrl}/payments/webhook/${encodeURIComponent(gateway || 'Unknown')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status,
          amount,
          transactionId: `mock_${gateway}_${Date.now()}`
        }),
      });

      if (status === 'success') {
        toast.success(`Payment via ${gateway} successful!`);
        clearCart();
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        toast.error(`Payment declined by ${gateway}.`);
        router.push(`/checkout`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Simulation error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        <ShieldCheck className="w-12 h-12 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Simulated Banking SDK</h1>
        <p className="text-muted-foreground mb-8">
          You are currently in the <strong>{gateway}</strong> simulated checkout environment. In production, this page would be hosted by the bank.
        </p>

        <div className="w-full bg-muted/30 border rounded-xl p-4 mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-sm">{orderId}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span className="text-primary">${amount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={() => handleSimulatePayment('success')}
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Simulate Successful Payment
          </button>
          
          <button 
            onClick={() => handleSimulatePayment('failed')}
            disabled={isProcessing}
            className="w-full bg-muted hover:bg-destructive/10 text-destructive font-bold py-4 rounded-xl transition-all"
          >
            Simulate Declined Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <MockGatewayContent />
    </Suspense>
  );
}
