"use client";

import { useState } from "react";
import Link from "next/link";
import { InlineLoader } from "@/components/ui/PageLoader";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getApiUrl } from "@/lib/api";
import { mapAuthResponse } from "@/lib/authResponse";
import SocialAuth from "@/components/auth/SocialAuth";
import {
  AuthError,
  AuthShell,
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requires2FA) {
          setError("Use the admin portal to sign in with two-factor authentication.");
          return;
        }
        const token = data.accessToken || data.token;
        login(mapAuthResponse({ ...data, token }));
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        window.location.href = "/";
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Continue with Google, Telegram, or email."
      topLink={{ href: "/register", label: "Sign up" }}
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <SocialAuth onError={setError} />

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className={authLabelClass}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className={authLabelClass}>
              Password
            </Label>
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading} className={`${authSubmitClass} mt-2`}>
          {loading ? <InlineLoader /> : "Continue"}
        </button>
      </form>
    </AuthShell>
  );
}
