"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { mapAuthResponse } from "@/lib/authResponse";
import {
  ensureGoogleSignInInitialized,
  renderGoogleSignInButton,
  setGoogleCredentialCallback,
} from "@/lib/googleSignIn";
import {
  GoogleIcon,
  SocialButton,
  TelegramIcon,
} from "@/components/auth/SocialButton";
import { isTelegramOidcConfigured, startTelegramOidcLogin } from "@/lib/telegramOidc";

type SocialAuthProps = {
  onError?: (message: string) => void;
  className?: string;
};

export default function SocialAuth({ onError, className = "" }: SocialAuthProps) {
  const { login } = useAuth();
  const [loading, setLoading] = useState<"google" | "telegram" | null>(null);
  const telegramStarted = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const telegramOidc = isTelegramOidcConfigured();
  const hasSocial = Boolean(googleClientId || telegramOidc);

  const completeAuth = useCallback(
    (data: unknown) => {
      const user = mapAuthResponse(data as Parameters<typeof mapAuthResponse>[0]);
      login(user);
      if (user.refreshToken) {
        localStorage.setItem("refreshToken", user.refreshToken);
      }
      window.location.href = "/";
    },
    [login]
  );

  const handleGoogleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        onError?.("Google sign-in was cancelled.");
        return;
      }

      setLoading("google");
      try {
        const res = await fetch(`${getApiUrl()}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = await res.json();
        if (!res.ok) {
          onError?.(data.message || "Google sign-in failed.");
          return;
        }
        completeAuth(data);
      } catch {
        onError?.("Google sign-in failed. Please try again.");
      } finally {
        setLoading(null);
      }
    },
    [completeAuth, onError]
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const container = googleButtonRef.current;
    let cancelled = false;

    setGoogleCredentialCallback((response) => {
      void handleGoogleCredential(response.credential);
    });

    (async () => {
      try {
        await ensureGoogleSignInInitialized(googleClientId);
        if (cancelled || !container) return;
        container.innerHTML = "";
        renderGoogleSignInButton(container, { width: 400 });
      } catch {
        onError?.("Could not load Google Sign-In.");
      }
    })();

    return () => {
      cancelled = true;
      container.innerHTML = "";
      setGoogleCredentialCallback(null);
    };
  }, [googleClientId, handleGoogleCredential, onError]);

  const handleTelegramClick = async () => {
    if (telegramStarted.current) return;
    telegramStarted.current = true;
    setLoading("telegram");
    try {
      await startTelegramOidcLogin();
    } catch (err) {
      telegramStarted.current = false;
      setLoading(null);
      onError?.(err instanceof Error ? err.message : "Telegram sign-in failed.");
    }
  };

  if (!hasSocial) {
    return null;
  }

  return (
    <div className={className}>
      <div className="grid gap-3">
        {googleClientId && (
          <div className="relative h-12 w-full md:h-11">
            <SocialButton
              label="Continue with Google"
              icon={<GoogleIcon />}
              loading={loading === "google"}
            />
            <div
              ref={googleButtonRef}
              className="absolute inset-0 z-10 cursor-pointer opacity-[0.01] [&>div]:!h-full [&>div]:!w-full [&>div>div]:!h-full [&>div>div]:!w-full"
            />
          </div>
        )}

        {telegramOidc && (
          <button
            type="button"
            onClick={handleTelegramClick}
            disabled={loading === "telegram"}
            className="w-full text-left"
          >
            <SocialButton
              label="Continue with Telegram"
              icon={<TelegramIcon />}
              loading={loading === "telegram"}
            />
          </button>
        )}
      </div>

      <div className="relative my-4 md:my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
}
