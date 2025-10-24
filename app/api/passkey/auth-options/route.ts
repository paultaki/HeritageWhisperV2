/**
 * POST /api/passkey/auth-options
 *
 * Generate WebAuthn authentication options for signing in with a passkey.
 * Uses discoverable credentials (no email required).
 */

import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { RP_ID, getAuthenticationOptions } from "@/lib/webauthn-config";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Generate authentication options
    // No user identification required thanks to discoverable credentials
    const baseOptions = getAuthenticationOptions();

    const options = await generateAuthenticationOptions({
      ...baseOptions,
      rpID: RP_ID,
    });

    // Return the options and challenge
    // Client will store the challenge and send it back during verification
    logger.info("[auth-options] Options generated successfully");

    return NextResponse.json({
      options,
    });
  } catch (error) {
    logger.error(
      "[auth-options] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}
