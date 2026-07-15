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
  Camera,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

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
  const { user, logout, login } = useAuth();
  const { t } = useStore();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    const toastId = toast.loading("Uploading avatar...");

    try {
      const res = await fetch(`${getApiUrl()}/upload/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image.");
      }

      const data = await res.json();
      const imageUrl = data.url;

      const saveRes = await fetch(`${getApiUrl()}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to update profile.");
      }

      login({
        ...user,
        avatar: imageUrl,
      });

      toast.success("Avatar updated successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update avatar.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 pb-6 pt-4 md:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-xl font-bold tracking-tight md:mb-8 md:text-3xl">{t("myAccount")}</h1>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 p-5 md:p-8">
            <div className="flex items-center gap-4">
              <div className="relative group size-16 shrink-0 md:size-20">
                <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 overflow-hidden border border-border/40">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : initial ? (
                    <span className="text-xl font-bold text-white md:text-2xl">{initial}</span>
                  ) : (
                    <User className="size-8 text-white/90 md:size-10" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity",
                    uploading && "opacity-100"
                  )}
                >
                  <Camera className="size-5 md:size-6" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
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
