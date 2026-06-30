"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Wallet, Gift } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import PriceDisplay from "@/components/features/PriceDisplay";
import { toast } from "sonner";

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useStore();
  const [data, setData] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [redeemPoints, setRedeemPoints] = useState("100");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";

  const load = () => {
    if (!user?.token) return;
    fetch(`${apiUrl}/customer/wallet`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Failed to load wallet"));
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    load();
  }, [user, router]);

  const topUp = async () => {
    const res = await fetch(`${apiUrl}/customer/wallet/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user!.token}` },
      body: JSON.stringify({ amount: parseFloat(topUpAmount) }),
    });
    if (res.ok) {
      toast.success("Wallet topped up");
      load();
    } else toast.error("Top-up failed");
  };

  const redeem = async () => {
    const res = await fetch(`${apiUrl}/customer/wallet/redeem-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user!.token}` },
      body: JSON.stringify({ points: parseInt(redeemPoints, 10) }),
    });
    if (res.ok) {
      toast.success("Points redeemed to wallet");
      load();
    } else {
      const d = await res.json();
      toast.error(d.message || "Redeem failed");
    }
  };

  if (!data) {
    return <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Wallet className="size-8" /> {t("wallet")}
      </h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="p-6 rounded-2xl border border-border/60 bg-card">
          <p className="text-sm text-muted-foreground">{t("walletBalance")}</p>
          <p className="text-3xl font-bold mt-2"><PriceDisplay amount={data.balance} /></p>
        </div>
        <div className="p-6 rounded-2xl border border-border/60 bg-card">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><Gift className="size-4" /> {t("loyaltyPoints")}</p>
          <p className="text-3xl font-bold mt-2">{data.loyaltyPoints?.toLocaleString()} pts</p>
          <p className="text-xs text-muted-foreground mt-1">100 pts = $1 wallet credit</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 border border-border/60 rounded-xl">
          <h2 className="font-semibold mb-3">Top up wallet</h2>
          <div className="flex gap-2">
            <input type="number" min="1" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="flex-1 h-10 px-3 border border-border rounded-lg bg-background" />
            <button type="button" onClick={topUp} className="px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Add funds</button>
          </div>
        </div>
        <div className="p-4 border border-border/60 rounded-xl">
          <h2 className="font-semibold mb-3">Redeem loyalty points</h2>
          <div className="flex gap-2">
            <input type="number" min="100" step="100" value={redeemPoints} onChange={(e) => setRedeemPoints(e.target.value)} className="flex-1 h-10 px-3 border border-border rounded-lg bg-background" />
            <button type="button" onClick={redeem} className="px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Redeem</button>
          </div>
        </div>
      </div>

      {data.transactions?.length > 0 && (
        <div className="mt-10">
          <h2 className="font-semibold mb-4">Recent activity</h2>
          <ul className="space-y-2 text-sm">
            {data.transactions.map((tx: any) => (
              <li key={tx._id} className="flex justify-between py-2 border-b border-border/40">
                <span>{tx.description || tx.type}</span>
                <span className="text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
