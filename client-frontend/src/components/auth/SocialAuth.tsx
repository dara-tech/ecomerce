"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { mapAuthResponse } from "@/lib/authResponse";
import {
  GoogleIcon,
  isTelegramDomainAllowed,
  SocialButton,
  TelegramIcon,
} from "@/components/auth/SocialButton";

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
  const [telegramAllowed, setTelegramAllowed] = useState(false);
  const telegramRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
  const hasSocial = Boolean(googleClientId || telegramBot);

  useEffect(() => {
    setTelegramAllowed(isTelegramDomainAllowed());
  }, []);

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
    if (!telegramBot || !telegramRef.current || !telegramAllowed) return;

    window.onTelegramAuth = handleTelegramAuth;

    const container = telegramRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramBot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      container.innerHTML = "";
    };
  }, [telegramBot, telegramAllowed, handleTelegramAuth]);

  if (!hasSocial) {
    return null;
  }

  return (
    <div className={className}>
      <div className="grid gap-3">
        {googleClientId && (
          <div className="relative h-11 w-full">
            <SocialButton
              label="Continue with Google"
              icon={<GoogleIcon />}
              loading={loading === "google"}
            />
            <div className="absolute inset-0 z-10 cursor-pointer opacity-[0.01] [&>div]:!h-full [&>div]:!w-full [&>div>div]:!h-full [&>div>div]:!w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => onError?.("Google sign-in failed.")}
                theme="outline"
                size="large"
                width={400}
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </div>
        )}

        {telegramBot && telegramAllowed && (
          <div className="relative h-11 w-full">
            <SocialButton
              label="Continue with Telegram"
              icon={<TelegramIcon />}
              loading={loading === "telegram"}
            />
            <div
              ref={telegramRef}
              className="absolute inset-0 z-10 overflow-hidden opacity-[0.01] [&>iframe]:!h-11 [&>iframe]:!min-h-full [&>iframe]:!w-full"
            />
          </div>
        )}

        {telegramBot && !telegramAllowed && (
          <SocialButton
            label="Continue with Telegram"
            icon={<TelegramIcon />}
            disabled
            hint="Telegram login is available on lunakh.vercel.app after BotFather domain setup."
          />
        )}
      </div>

      <div className="relative my-6">
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
