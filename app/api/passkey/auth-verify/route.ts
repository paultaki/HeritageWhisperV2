/**
 * POST /api/passkey/auth-verify
 *
 * Verify the WebAuthn authentication response and create a session.
 * Implements counter regression detection and session creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import {
  getPasskeyByCredentialId,
  getUserById,
  updatePasskeyCounter,
} from "@/lib/db-admin";
import { getExpectedOrigin, getExpectedRPID } from "@/lib/webauthn-config";
import { mintRLSJwt } from "@/lib/jwt";
import { setPasskeySession } from "@/lib/iron-session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const {
      credential,
      challenge,
    }: {
      credential: AuthenticationResponseJSON;
      challenge: string;
    } = await request.json();

    if (!credential || !challenge) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 1: Get the passkey from the database
    // credential.rawId and credential.id are already base64url strings
    const credentialId = credential.rawId || credential.id;

    logger.info("[auth-verify] Looking up passkey:", {
      credentialId,
      rawIdLength: credential.rawId?.length,
      idLength: credential.id?.length,
    });

    const passkey = await getPasskeyByCredentialId(credentialId);

    if (!passkey) {
      logger.warn("[auth-verify] Passkey not found for credential:", credentialId);
      return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
    }

    // Step 2: Get user details
    const user = await getUserById(passkey.userId);
    if (!user) {
      logger.warn("[auth-verify] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 3: Verify the authentication response
    const publicKey = Buffer.from(passkey.publicKey, "base64url");
    const credentialID = Buffer.from(passkey.credentialId, "base64url");

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getExpectedRPID(),
      credential: {
        id: credentialID,
        publicKey: publicKey,
        counter: passkey.signCount,
      } as any,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      logger.warn("[auth-verify] Verification failed");
      return NextResponse.json(
        { error: "Passkey verification failed" },
        { status: 401 }
      );
    }

    const { authenticationInfo } = verification;
    const { newCounter } = authenticationInfo;

    // Step 4: Counter regression detection
    // Only reject if counter goes BACKWARDS (cloned authenticator)
    // Accept if counter is unchanged or increases
    if (newCounter > 0 && newCounter < passkey.signCount) {
      logger.error("[auth-verify] Counter regression detected", {
        oldCounter: passkey.signCount,
        newCounter,
        userId: passkey.userId,
      });
      return NextResponse.json(
        {
          error: "Security warning: This passkey may have been cloned",
          code: "COUNTER_REGRESSION",
        },
        { status: 403 }
      );
    }

    // Step 5: Update counter
    await updatePasskeyCounter(credentialId, newCounter);

    // Step 6: Mint RLS JWT
    const passkeyJwt = await mintRLSJwt(passkey.userId);

    // Step 7: Create iron-session cookie
    await setPasskeySession(passkey.userId, user.email, passkeyJwt);

    logger.info("[auth-verify] Authentication successful", {
      userId: passkey.userId,
    });

    // Return user data (matching the format from regular login)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error(
      "[auth-verify] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
