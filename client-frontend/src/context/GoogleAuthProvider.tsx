"use client";

import { ReactNode, useEffect } from "react";
import { ensureGoogleSignInInitialized } from "@/lib/googleSignIn";

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) return;
    void ensureGoogleSignInInitialized(clientId);
  }, [clientId]);

  return <>{children}</>;
}
