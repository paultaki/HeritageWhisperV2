/**
 * Server-only Unsubscribe Token Utilities
 *
 * SECURITY: This file uses 'server-only' to guarantee it can NEVER be imported
 * into client-side code. Uses SESSION_SECRET for HMAC signing (not the Supabase
 * service role key, which should only be used for Supabase authentication).
 *
 * @module lib/unsubscribe-token
 */

import "server-only";

import crypto from 'crypto';
import { env } from "@/lib/env";

// =============================================================================
// Secret Validation
// =============================================================================

// SESSION_SECRET is validated by lib/env.ts (min 32 chars, required)
const tokenSecret: string = env.SESSION_SECRET;

// =============================================================================
// Token Generation & Verification
// =============================================================================

/**
 * Generate an unsubscribe token for a family member
 * Format: {familyMemberId}.{hmacSignature}
 *
 * This is used by email templates to create unsubscribe links.
 * Uses SESSION_SECRET (not Supabase service key) for cryptographic signing.
 */
export function generateUnsubscribeToken(familyMemberId: string): string {
  const hmac = crypto.createHmac('sha256', tokenSecret);
  hmac.update(familyMemberId);
  const signature = hmac.digest('hex');
  return `${familyMemberId}.${signature}`;
}

/**
 * Verify an unsubscribe token and extract the family member ID
 * Returns the family member ID if valid, null otherwise
 *
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const [familyMemberId, providedSignature] = token.split('.');

    if (!familyMemberId || !providedSignature) {
      return null;
    }

    // Regenerate the signature using the same secret
    const hmac = crypto.createHmac('sha256', tokenSecret);
    hmac.update(familyMemberId);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return familyMemberId;
    }

    return null;
  } catch (error) {
    console.error('[UnsubscribeToken] Verification error:', error);
    return null;
  }
}
