"use client";

import type { User } from "@/context/AuthContext";

export type AuthApiResponse = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
};

export function mapAuthResponse(data: AuthApiResponse): User {
  const token = data.accessToken || data.token;
  if (!token) {
    throw new Error("Missing access token");
  }

  return {
    _id: data._id,
    name: data.name,
    email: data.email,
    role: data.role,
    isAdmin: data.role === "admin",
    token,
    refreshToken: data.refreshToken,
  };
}
