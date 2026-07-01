"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Gift, ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import PriceDisplay from "@/components/features/PriceDisplay";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { PageLoader } from "@/components/ui/PageLoader";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useStore();
  const [data, setData] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [redeemPoints, setRedeemPoints] = useState("100");
  const [busy, setBusy] = useState<"topup" | "redeem" | null>(null);
  const apiUrl = getApiUrl();

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
    setBusy("topup");
    try {
      const res = await fetch(`${apiUrl}/customer/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user!.token}`,
        },
        body: JSON.stringify({ amount: parseFloat(topUpAmount) }),
      });
      if (res.ok) {
        toast.success("Wallet topped up");
        load();
      } else {
        toast.error("Top-up failed");
      }
    } finally {
      setBusy(null);
    }
  };

  const redeem = async () => {
    setBusy("redeem");
    try {
      const res = await fetch(`${apiUrl}/customer/wallet/redeem-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user!.token}`,
        },
        body: JSON.stringify({ points: parseInt(redeemPoints, 10) }),
      });
      if (res.ok) {
        toast.success("Points redeemed to wallet");
        load();
      } else {
        const d = await res.json();
        toast.error(d.message || "Redeem failed");
      }
    } finally {
      setBusy(null);
    }
  };

  if (!data) {
    return <PageLoader label={t("loadingWallet")} />;
  }

  const quickAmounts = ["5", "10", "20", "50"];

  const inputClass =
    "h-11 w-full min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-4 text-sm outline-none transition-colors focus:border-foreground";

  return (
    <div className="container mx-auto max-w-2xl px-4 pb-[var(--mobile-tab-bar-h)] pt-4 md:pb-12 md:py-12">
      <div className="mb-4 flex items-start justify-between gap-3 md:mb-8">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-3xl">
            <Wallet className="size-6 md:size-8" />
            {t("wallet")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("walletHint")}</p>
        </div>
        <Link
          href="/profile"
          className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:text-sm"
        >
          <ArrowLeft className="size-3.5 md:size-4" />
          <span className="hidden sm:inline">{t("backToProfile")}</span>
          <span className="sm:hidden">{t("account")}</span>
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-8 md:gap-4">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-foreground to-foreground/85 p-5 text-background">
          <p className="text-xs font-medium text-background/70">{t("walletBalance")}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums md:text-3xl">
            <PriceDisplay amount={data.balance} />
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Gift className="size-4" />
            {t("loyaltyPoints")}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums md:text-3xl">
            {data.loyaltyPoints?.toLocaleString()}{" "}
            <span className="text-base font-semibold text-muted-foreground">{t("pointsShort")}</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("pointsRate")}</p>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold md:text-base">{t("topUpWallet")}</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setTopUpAmount(amount)}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
                  topUpAmount === amount
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground"
                )}
              >
                ${amount}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min="1"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className={inputClass}
              aria-label={t("topUpWallet")}
            />
            <button
              type="button"
              onClick={topUp}
              disabled={busy === "topup"}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-transform active:scale-[0.98] disabled:opacity-50 sm:min-w-[7rem]"
            >
              {t("addFunds")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold md:text-base">{t("redeemLoyaltyPoints")}</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min="100"
              step="100"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              className={inputClass}
              aria-label={t("redeemLoyaltyPoints")}
            />
            <button
              type="button"
              onClick={redeem}
              disabled={busy === "redeem"}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background px-5 text-sm font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-50 sm:min-w-[7rem]"
            >
              {t("redeem")}
            </button>
          </div>
        </section>
      </div>

      <section className="mt-6 md:mt-10">
        <h2 className="mb-3 text-sm font-semibold md:text-base">{t("recentActivity")}</h2>
        {data.transactions?.length > 0 ? (
          <ul className="space-y-2">
            {data.transactions.map((tx: any) => {
              const isCredit = tx.type === "credit" || tx.amount > 0;
              return (
                <li
                  key={tx._id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      isCredit ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {tx.amount != null && (
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        isCredit ? "text-green-600" : "text-foreground"
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      <PriceDisplay amount={Math.abs(tx.amount)} />
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("noTransactions")}
          </div>
        )}
      </section>
    </div>
  );
}
