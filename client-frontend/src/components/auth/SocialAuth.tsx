"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { mapAuthResponse } from "@/lib/authResponse";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

type TelegramAuthUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type SocialAuthProps = {
  onError?: (message: string) => void;
  className?: string;
};

export default function SocialAuth({ onError, className = "" }: SocialAuthProps) {
  const { login } = useAuth();
  const [loading, setLoading] = useState<"google" | "telegram" | null>(null);
  const telegramRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
  const hasSocial = Boolean(googleClientId || telegramBot);

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

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.("Google sign-in was cancelled.");
      return;
    }

    setLoading("google");
    try {
      const res = await fetch(`${getApiUrl()}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
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
  };

  const handleTelegramAuth = useCallback(
    async (telegramUser: TelegramAuthUser) => {
      setLoading("telegram");
      try {
        const res = await fetch(`${getApiUrl()}/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telegramUser),
        });
        const data = await res.json();
        if (!res.ok) {
          onError?.(data.message || "Telegram sign-in failed.");
          return;
        }
        completeAuth(data);
      } catch {
        onError?.("Telegram sign-in failed. Please try again.");
      } finally {
        setLoading(null);
      }
    },
    [completeAuth, onError]
  );

  useEffect(() => {
    if (!telegramBot || !telegramRef.current) return;

    window.onTelegramAuth = handleTelegramAuth;

    const container = telegramRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramBot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      container.innerHTML = "";
    };
  }, [telegramBot, handleTelegramAuth]);

  if (!hasSocial) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3">
        {googleClientId && (
          <div className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
            {loading === "google" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            <div className="flex w-full justify-center py-0.5 [&>div]:!w-full [&>div>div]:!w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => onError?.("Google sign-in failed.")}
                theme="outline"
                size="large"
                width={360}
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </div>
        )}

        {telegramBot && (
          <div className="relative flex min-h-11 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
            {loading === "telegram" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            <div ref={telegramRef} className="flex w-full justify-center py-1 [&>iframe]:!max-w-full" />
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or use email</span>
        </div>
      </div>
    </div>
  );
}
