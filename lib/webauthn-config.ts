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
 */
export function getExpectedOrigin(): string {
  return ORIGIN;
}

/**
 * Get expected RP ID for verification
 */
export function getExpectedRPID(): string {
  return RP_ID;
}
