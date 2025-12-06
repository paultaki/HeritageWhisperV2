/**
 * Iron Session Configuration for Passkey Authentication
 *
 * This module manages encrypted httpOnly cookies for passkey sessions.
 * The cookie stores the RLS JWT token for server-side Supabase calls.
 *
 * SECURITY: Uses validated env vars from lib/env.ts
 */

import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Session data structure
export interface PasskeySessionData {
  userId: string;
  email: string;
  passkeyJwt: string; // RLS JWT for Supabase server-side calls
  createdAt: number;
  expiresAt: number;
}

// Validate password at module load (fail fast if missing in production)
const sessionPassword = env.IRON_SESSION_PASSWORD;
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
if (!isBuildPhase && !sessionPassword && process.env.NODE_ENV === 'production') {
  throw new Error('IRON_SESSION_PASSWORD is required in production');
}

// Iron session configuration
const sessionOptions = {
  password: sessionPassword || 'development-only-password-min-32-chars!!',
  cookieName: env.COOKIE_NAME || "hw_passkey_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

/**
 * Get the current passkey session
 * Returns null if no session exists or session is expired
 */
export async function getPasskeySession(): Promise<PasskeySessionData | null> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<PasskeySessionData>(
      cookieStore,
      sessionOptions
    );

    // Check if session exists and is not expired
    if (!session.userId || !session.passkeyJwt) {
      return null;
    }

    if (session.expiresAt && Date.now() > session.expiresAt) {
      // Session expired
      await destroyPasskeySession();
      return null;
    }

    return {
      userId: session.userId,
      email: session.email,
      passkeyJwt: session.passkeyJwt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    console.error("[getPasskeySession] Error:", error);
    return null;
  }
}

/**
 * Create or update the passkey session
 */
export async function setPasskeySession(
  userId: string,
  email: string,
  passkeyJwt: string
): Promise<IronSession<PasskeySessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<PasskeySessionData>(
    cookieStore,
    sessionOptions
  );

  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now

  session.userId = userId;
  session.email = email;
  session.passkeyJwt = passkeyJwt;
  session.createdAt = now;
  session.expiresAt = expiresAt;

  await session.save();

  return session;
}

/**
 * Destroy the passkey session
 */
export async function destroyPasskeySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<PasskeySessionData>(
      cookieStore,
      sessionOptions
    );
    session.destroy();
  } catch (error) {
    console.error("[destroyPasskeySession] Error:", error);
  }
}

/**
 * Refresh the session expiry time (extend by 7 days)
 */
export async function refreshPasskeySession(): Promise<boolean> {
  try {
    const session = await getPasskeySession();
    if (!session) {
      return false;
    }

    const newExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const cookieStore = await cookies();
    const ironSession = await getIronSession<PasskeySessionData>(
      cookieStore,
      sessionOptions
    );

    ironSession.expiresAt = newExpiresAt;
    await ironSession.save();

    return true;
  } catch (error) {
    console.error("[refreshPasskeySession] Error:", error);
    return false;
  }
}
