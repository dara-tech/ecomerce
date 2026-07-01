"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { mapAuthResponse } from "@/lib/authResponse";
import {
  clearTelegramPkceSession,
  getTelegramCallbackUrl,
  loadTelegramPkceSession,
} from "@/lib/telegramOidc";

function TelegramCallbackContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oidcError = searchParams.get("error");

    if (oidcError) {
      setError("Telegram sign-in was cancelled.");
      clearTelegramPkceSession();
      return;
    }

    const pkce = loadTelegramPkceSession();

    if (code && state && pkce) {
      if (state !== pkce.state) {
        setError("Telegram sign-in failed: invalid state.");
        clearTelegramPkceSession();
        return;
      }

      let cancelled = false;

      (async () => {
        try {
          const res = await fetch(`${getApiUrl()}/auth/telegram/oidc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              codeVerifier: pkce.codeVerifier,
              redirectUri: pkce.redirectUri || getTelegramCallbackUrl(),
            }),
          });
          const data = await res.json();
          clearTelegramPkceSession();
          if (cancelled) return;

          if (!res.ok) {
            setError(data.message || "Telegram sign-in failed.");
            return;
          }

          const user = mapAuthResponse(data);
          login(user);
          if (user.refreshToken) {
            localStorage.setItem("refreshToken", user.refreshToken);
          }
          window.location.href = "/";
        } catch {
          clearTelegramPkceSession();
          if (!cancelled) {
            setError("Telegram sign-in failed. Please try again.");
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    const id = searchParams.get("id");
    const hash = searchParams.get("hash");
    const authDate = searchParams.get("auth_date");

    if (!id || !hash || !authDate) {
      setError("Telegram sign-in was cancelled or the link expired.");
      return;
    }

    const payload = {
      id: Number(id),
      first_name: searchParams.get("first_name") || undefined,
      last_name: searchParams.get("last_name") || undefined,
      username: searchParams.get("username") || undefined,
      photo_url: searchParams.get("photo_url") || undefined,
      auth_date: Number(authDate),
      hash,
    };

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.message || "Telegram sign-in failed.");
          return;
        }

        const user = mapAuthResponse(data);
        login(user);
        if (user.refreshToken) {
          localStorage.setItem("refreshToken", user.refreshToken);
        }
        window.location.href = "/";
      } catch {
        if (!cancelled) {
          setError("Telegram sign-in failed. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, login]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Link
            href="/login"
            className="inline-flex text-sm font-medium text-foreground hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-3 px-4">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completing Telegram sign-in…</p>
    </div>
  );
}

export default function TelegramCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TelegramCallbackContent />
    </Suspense>
  );
}
