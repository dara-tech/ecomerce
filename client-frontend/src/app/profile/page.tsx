"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  LogOut,
  Package,
  Wallet,
  Heart,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

function ProfileMenuItem({
  href,
  icon: Icon,
  title,
  subtitle,
  destructive,
  onClick,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  destructive?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background p-3.5 text-left transition-colors active:scale-[0.99] md:p-4",
    destructive
      ? "hover:border-destructive/40"
      : "hover:border-foreground/30 hover:bg-muted/30"
  );

  const content = (
    <>
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          destructive ? "bg-destructive/10" : "bg-muted"
        )}
      >
        <Icon className={cn("size-5", destructive ? "text-destructive" : "text-foreground")} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={cn("text-sm font-semibold", destructive && "text-destructive")}>{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
      {!destructive && <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className={className}>
      {content}
    </Link>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      const storedUser = localStorage.getItem("userInfo");
      if (!storedUser) {
        router.push("/login");
      }
    }
  }, [user, router]);

  if (!user) {
    return <PageLoader label="Loading profile…" />;
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 pb-6 pt-4 md:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-xl font-bold tracking-tight md:mb-8 md:text-3xl">{t("myAccount")}</h1>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 p-5 md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 md:size-20">
                {initial ? (
                  <span className="text-xl font-bold text-white md:text-2xl">{initial}</span>
                ) : (
                  <User className="size-8 text-white/90 md:size-10" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold leading-tight md:text-2xl">{user.name}</h2>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:p-6">
            <ProfileMenuItem
              href="/orders"
              icon={Package}
              title={t("orders")}
              subtitle={t("ordersHint")}
            />
            <ProfileMenuItem
              href="/wallet"
              icon={Wallet}
              title={t("wallet")}
              subtitle={t("walletHint")}
            />
            <ProfileMenuItem
              href="/wishlist"
              icon={Heart}
              title={t("wishlist")}
              subtitle={t("wishlistHint")}
            />
            <ProfileMenuItem
              icon={LogOut}
              title={t("logout")}
              subtitle={t("logoutHint")}
              destructive
              onClick={() => {
                logout();
                router.push("/login");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
