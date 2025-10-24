/**
 * JWT Utilities for Passkey Authentication
 *
 * This module creates Supabase-compatible JWT tokens for Row Level Security (RLS).
 * These tokens are stored in httpOnly cookies and used in server-side API calls.
 */

import { SignJWT } from "jose";

/**
 * Mint a Supabase-compatible JWT for RLS
 *
 * The token includes:
 * - sub: User ID (required for RLS policies)
 * - role: 'authenticated' (required for Supabase RLS)
 * - iss: issuer
 * - aud: audience
 * - exp: expiration (7 days)
 * - iat: issued at
 */
export async function mintRLSJwt(userId: string): Promise<string> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "SUPABASE_JWT_SECRET not configured. Get it from Supabase Dashboard > Project Settings > API"
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  // Create JWT with Supabase-compatible claims
  const token = await new SignJWT({
    sub: userId,
    role: "authenticated",
    aud: "authenticated",
    iss: "heritagewhisper-passkey",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(new TextEncoder().encode(jwtSecret));

  return token;
}

/**
 * Verify a JWT and extract the user ID
 * Returns null if token is invalid or expired
 */
export async function verifyRLSJwt(token: string): Promise<string | null> {
  try {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
      console.error("[verifyRLSJwt] SUPABASE_JWT_SECRET not configured");
      return null;
    }

    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret)
    );

    if (!payload.sub) {
      console.error("[verifyRLSJwt] No sub claim in token");
      return null;
    }

    return payload.sub as string;
  } catch (error) {
    console.error("[verifyRLSJwt] Token verification failed:", error);
    return null;
  }
}
