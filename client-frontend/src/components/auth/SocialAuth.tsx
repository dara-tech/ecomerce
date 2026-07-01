"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import { mapAuthResponse } from "@/lib/authResponse";
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

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const telegramOidc = isTelegramOidcConfigured();
  const hasSocial = Boolean(googleClientId || telegramOidc);

  const completeAuth = (data: unknown) => {
    const user = mapAuthResponse(data as Parameters<typeof mapAuthResponse>[0]);
    login(user);
    if (user.refreshToken) {
      localStorage.setItem("refreshToken", user.refreshToken);
    }
    window.location.href = "/";
  };

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

      <div className="relative my-5 md:my-6">
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
