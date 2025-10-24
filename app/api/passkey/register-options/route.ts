/**
 * POST /api/passkey/register-options
 *
 * Generate WebAuthn registration options for creating a new passkey.
 * Requires email/password authentication first.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getUserByEmail, getUserPasskeys } from "@/lib/db-admin";
import { RP_ID, RP_NAME, getRegistrationOptions } from "@/lib/webauthn-config";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Step 1: Authenticate with Supabase to verify user
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

    if (authError || !authData.user) {
      logger.warn("[register-options] Authentication failed");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    const userName = email.trim();
    const userDisplayName =
      authData.user.user_metadata?.name || email.split("@")[0];

    // Step 2: Get existing passkeys to exclude
    const existingPasskeys = await getUserPasskeys(userId);
    const excludeCredentials = existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      type: "public-key" as const,
      transports: pk.transports,
    }));

    // Step 3: Generate registration options
    const baseOptions = getRegistrationOptions(
      userId,
      userName,
      userDisplayName
    );

    const options = await generateRegistrationOptions({
      ...baseOptions,
      rpID: RP_ID,
      rpName: RP_NAME,
      excludeCredentials,
    });

    // Store challenge in session or return it for client to store
    // For simplicity, we'll return it and have the client send it back during verification
    logger.info("[register-options] Options generated successfully");

    return NextResponse.json({
      options,
      userId, // Include userId for the verify step
    });
  } catch (error) {
    logger.error(
      "[register-options] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}
