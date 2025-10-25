/**
 * POST /api/passkey/register-verify
 *
 * Verify the WebAuthn registration response and create a new passkey.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";
import { createPasskey, getUserById } from "@/lib/db-admin";
import { getExpectedOrigin, getExpectedRPID } from "@/lib/webauthn-config";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown as {
      userId: string;
      credential: RegistrationResponseJSON;
      challenge: string;
      friendlyName?: string;
    };
    const { userId, credential, challenge, friendlyName } = body;

    if (!userId || !credential || !challenge) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 1: Verify the registration response
    const expectedOrigin = getExpectedOrigin();
    const expectedRPID = getExpectedRPID();

    logger.info("[register-verify] Verifying with:", {
      expectedOrigin,
      expectedRPID,
      credentialOrigin: credential.response.clientDataJSON,
    });

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    }) as VerifiedRegistrationResponse;

    if (!verification.verified || !verification.registrationInfo) {
      logger.warn("[register-verify] Verification failed", { verification });
      return NextResponse.json(
        { error: "Passkey verification failed" },
        { status: 400 }
      );
    }

    const { registrationInfo } = verification;
    const info = registrationInfo as unknown as {
      credentialID?: Uint8Array;
      credentialPublicKey?: Uint8Array;
      counter?: number;
      aaguid?: string;
      credentialBackedUp?: boolean;
      credentialDeviceType?: string;
    };

    const credentialID = info.credentialID!;
    const credentialPublicKey = info.credentialPublicKey!;
    const counter = info.counter ?? 0;
    const credentialBackedUp = info.credentialBackedUp ?? false;
    const credentialDeviceType = info.credentialDeviceType ?? "singleDevice";

    // Step 2: Generate friendly name if not provided
    let name = friendlyName;
    if (!name) {
      const deviceType =
        credentialDeviceType === "singleDevice" ? "Device" : "Multi-Device";
      const date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      name = `${deviceType} Passkey (${date})`;
    }

    // Step 3: Store the passkey in the database
    const passkey = await createPasskey({
      userId: userId,
      credentialId: Buffer.from(credentialID).toString("base64url"),
      publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
      signCount: counter,
      credentialBackedUp,
      credentialDeviceType,
      transports: credential.response.transports as ("ble" | "internal" | "nfc" | "usb" | "cable" | "hybrid")[] | undefined,
      friendlyName: name,
    });

    if (!passkey) {
      logger.error("[register-verify] Failed to create passkey");
      return NextResponse.json(
        { error: "Failed to save passkey" },
        { status: 500 }
      );
    }

    logger.info("[register-verify] Passkey registered successfully", {
      userId,
      passkeyId: passkey.id,
    });

    return NextResponse.json({
      success: true,
      passkey: {
        id: passkey.id,
        friendlyName: passkey.friendlyName,
        credentialDeviceType: passkey.credentialDeviceType,
        credentialBackedUp: passkey.credentialBackedUp,
        createdAt: passkey.createdAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("[register-verify] Error:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      {
        error: "Failed to verify registration",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
