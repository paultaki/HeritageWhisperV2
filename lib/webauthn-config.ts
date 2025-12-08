/**
 * WebAuthn Configuration for Passkey Authentication
 *
 * This module provides configuration for SimpleWebAuthn library,
 * including registration and authentication options.
 */

import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from "@simplewebauthn/server";

// Environment variables
export const RP_ID = process.env.RP_ID || "heritagewhisper.com";
export const RP_NAME = process.env.RP_NAME || "HeritageWhisper";
export const ORIGIN = process.env.ORIGIN || "http://localhost:3002";

/**
 * Get registration options for creating a new passkey
 *
 * Uses discoverable credentials (residentKey: 'required') to enable
 * username-less authentication flow.
 */
export function getRegistrationOptions(
  userId: string,
  userName: string,
  userDisplayName: string
): Omit<GenerateRegistrationOptionsOpts, "rpID" | "rpName"> {
  // Convert userId (UUID string) to bytes using TextEncoder
  // WebAuthn requires userID as Uint8Array, not a string
  const userIdBytes = new TextEncoder().encode(userId);

  return {
    userID: userIdBytes,
    userName: userName, // Email address
    userDisplayName: userDisplayName, // Friendly name
    attestationType: "none", // No attestation required
    authenticatorSelection: {
      residentKey: "required", // Discoverable credential
      userVerification: "required", // Require biometric/PIN
      authenticatorAttachment: "platform", // Prefer platform authenticators (Touch ID, Face ID)
    },
    timeout: 60000, // 60 seconds
    excludeCredentials: [], // Will be populated with existing credentials in API
  };
}

/**
 * Get authentication options for signing in with passkey
 *
 * Uses userVerification: 'required' for security.
 */
export function getAuthenticationOptions(): Omit<
  GenerateAuthenticationOptionsOpts,
  "rpID"
> {
  return {
    timeout: 60000, // 60 seconds
    userVerification: "required", // Require biometric/PIN
    allowCredentials: [], // Empty = allow any registered passkey (discoverable)
  };
}

/**
 * Validate the origin matches our expected origin
 */
export function isValidOrigin(origin: string): boolean {
  const expected = ORIGIN;

  // Allow localhost variations for development
  if (expected.includes("localhost")) {
    return (
      origin === expected ||
      origin === "http://localhost:3002" ||
      origin === "http://127.0.0.1:3002"
    );
  }

  return origin === expected;
}

/**
 * Get expected origin for verification
 * Returns an array to support both www and non-www variants
 */
export function getExpectedOrigin(): string | string[] {
  // For production, accept both www and non-www variants
  if (ORIGIN.includes("heritagewhisper.com")) {
    return [
      "https://heritagewhisper.com",
      "https://www.heritagewhisper.com",
    ];
  }
  return ORIGIN;
}

/**
 * Get expected RP ID for verification
 */
export function getExpectedRPID(): string {
  return RP_ID;
}

/**
 * Validate WebAuthn configuration and log warnings if suspicious
 *
 * This is a defensive check to catch common misconfigurations.
 * Does NOT throw errors to avoid breaking working setups.
 */
export function validateWebAuthnConfig(): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check 1: RP_ID and ORIGIN domain should be compatible
  try {
    const originUrl = new URL(ORIGIN);
    const originHostname = originUrl.hostname;

    // For localhost, RP_ID should be "localhost"
    if (originHostname === "localhost" || originHostname === "127.0.0.1") {
      if (RP_ID !== "localhost") {
        warnings.push(
          `⚠️  RP_ID mismatch: Running on ${originHostname} but RP_ID is "${RP_ID}". ` +
            `For local development, set RP_ID=localhost in .env.local`
        );
      }
    }
    // For production domains, RP_ID should match or be a suffix
    else if (
      !originHostname.endsWith(RP_ID) &&
      originHostname !== RP_ID
    ) {
      warnings.push(
        `⚠️  RP_ID mismatch: Origin is ${ORIGIN} but RP_ID is "${RP_ID}". ` +
          `RP_ID should match the domain (e.g., ${originHostname}) or be a valid suffix.`
      );
    }
  } catch (err) {
    warnings.push(`⚠️  Invalid ORIGIN URL: "${ORIGIN}"`);
  }

  // Check 2: Production should use HTTPS
  if (
    !ORIGIN.startsWith("https://") &&
    !ORIGIN.includes("localhost") &&
    !ORIGIN.includes("127.0.0.1")
  ) {
    warnings.push(
      `⚠️  Production should use HTTPS. Current ORIGIN: ${ORIGIN}`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
