"use client";

import { useState } from "react";
import Link from "next/link";
import { InlineLoader } from "@/components/ui/PageLoader";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  AuthError,
  AuthShell,
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthShell";

export default function VendorRegisterPage() {
  const { user, login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredVendor, setRegisteredVendor] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = user ? "/vendor/create-store" : "/vendor/register";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const body = user
        ? { storeName, storeDescription }
        : { name, email, password, storeName, storeDescription };

      const res = await fetch(`${getApiUrl()}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setRegisteredVendor(data.vendor);
        if (user) {
           login(data.vendor); // update context so navbar updates immediately
        }
        setSuccess(true);
      } else {
        setError(data.message || "Could not register your store");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "vendor" || success) {
    return (
      <AuthShell
        title="Store Registered!"
        subtitle="Your shop profile is active."
        footer={
          <Link href="/" className="font-medium text-foreground hover:underline">
            Back to storefront
          </Link>
        }
      >
        <div className="space-y-4 text-center py-6">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-foreground">Welcome to the Marketplace</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {success 
              ? `Your store ${storeName} is registered. You can now access your seller dashboard.`
              : "You already have a registered store profile. Head over to your dashboard to manage your products."}
          </p>
          <div className="pt-4">
            <a
              href={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://lunakh-admin.vercel.app'}/login?token=${encodeURIComponent(registeredVendor?.token || user?.token || "")}&user=${encodeURIComponent(JSON.stringify(registeredVendor || user || {}))}`}
              className="inline-flex h-9 items-center justify-center bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors"
            >
              Go to Vendor Portal
            </a>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={user ? "Activate Seller Profile" : "Become a Vendor"}
      subtitle={user ? "Open a store on your current account." : "Open your shop profile and sell on our platform."}
      footer={
        !user ? (
          <>
            Already have a seller account?{" "}
            <a href={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://lunakh-admin.vercel.app'}/login`} className="font-medium text-foreground hover:underline">
              Sign in
            </a>
          </>
        ) : (
          <Link href="/" className="font-medium text-foreground hover:underline">
            Back to storefront
          </Link>
        )
      }
    >
      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {!user && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name" className={authLabelClass}>
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={authInputClass}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className={authLabelClass}>
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="merchant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className={authLabelClass}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInputClass}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </>
        )}

        <div className={!user ? "space-y-1.5 border-t border-border/40 pt-4 mt-2" : "space-y-1.5"}>
          <Label htmlFor="storeName" className={authLabelClass}>
            Store name
          </Label>
          <Input
            id="storeName"
            type="text"
            placeholder="e.g. Cambodia Tech Zone"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className={authInputClass}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="storeDescription" className={authLabelClass}>
            Store description
          </Label>
          <textarea
            id="storeDescription"
            rows={3}
            placeholder="Describe what items you sell..."
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
            className="flex w-full border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? <InlineLoader /> : user ? "Activate Seller Profile" : "Register Store"}
        </button>
      </form>
    </AuthShell>
  );
}
