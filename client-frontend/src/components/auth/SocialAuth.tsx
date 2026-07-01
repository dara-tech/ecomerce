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

  const [host, setHost] = useState("");
  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  const telegramAllowedHosts = (
    process.env.NEXT_PUBLIC_TELEGRAM_ALLOWED_HOSTS || "localhost,lunakh.vercel.app"
  )
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  const telegramDomainOk = !host || telegramAllowedHosts.includes(host);

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
    if (!telegramBot || !telegramRef.current || !telegramDomainOk) return;

    window.onTelegramAuth = handleTelegramAuth;

    const container = telegramRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramBot);
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-radius", "20");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      container.innerHTML = "";
    };
  }, [telegramBot, handleTelegramAuth, telegramDomainOk]);

  if (!hasSocial) {
    return null;
  }

  return (
    <div className={className}>
      <div className="grid gap-2.5">
        {googleClientId && (
          <div className="relative flex min-h-11 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background/80">
            {loading === "google" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-[1px]">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="flex w-full scale-[1.02] justify-center py-1 [&>div]:w-full [&>div>div]:mx-auto">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => onError?.("Google sign-in failed.")}
                theme="outline"
                size="medium"
                width={340}
                text="continue_with"
                shape="pill"
              />
            </div>
          </div>
        )}

        {telegramBot && (
          telegramDomainOk ? (
            <div className="relative flex min-h-11 flex-col items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background/80">
              {loading === "telegram" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-[1px]">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <div
                ref={telegramRef}
                className="flex scale-95 justify-center py-0.5 [&>iframe]:max-w-full"
              />
            </div>
          ) : (
            <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-center text-xs leading-relaxed text-muted-foreground">
              Telegram login is available on{" "}
              <span className="font-medium text-foreground">{telegramAllowedHosts.join(" or ")}</span>.
              {host ? (
                <>
                  {" "}
                  You are on <span className="font-medium">{host}</span>.
                </>
              ) : null}
            </p>
          )
        )}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
}
