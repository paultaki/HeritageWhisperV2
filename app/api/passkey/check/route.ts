/**
 * POST /api/passkey/check
 *
 * Check if a user (by email) has any passkeys registered.
 * Used to conditionally show the "Sign in with Passkey" button.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUserPasskeys } from "@/lib/db-admin";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Get user by email
    const user = await getUserByEmail(email.trim().toLowerCase());

    if (!user) {
      // Don't reveal if user exists - just say no passkeys
      return NextResponse.json({ hasPasskeys: false });
    }

    // Check if user has any passkeys
    const passkeys = await getUserPasskeys(user.id);

    return NextResponse.json({
      hasPasskeys: passkeys.length > 0,
    });
  } catch (error) {
    logger.error(
      "[check] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to check passkeys" },
      { status: 500 }
    );
  }
}
