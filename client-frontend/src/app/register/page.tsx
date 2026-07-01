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

export default function RegisterPage() {
  const [name, setName] = useState("");
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
      const res = await fetch(`${getApiUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        login(mapAuthResponse(data));
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        window.location.href = "/";
      } else {
        setError(data.message || "Could not create your account");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Get started with Google, Telegram, or email."
      topLink={{ href: "/login", label: "Sign in" }}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <SocialAuth onError={setError} />

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
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

        <button type="submit" disabled={loading} className={`${authSubmitClass} mt-2`}>
          {loading ? <InlineLoader /> : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/80">
        By continuing, you agree to our terms and privacy policy.
      </p>
    </AuthShell>
  );
}
