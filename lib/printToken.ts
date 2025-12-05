/**
 * Temporary Print Token System
 *
 * Generates short-lived tokens that allow PDFShift to access
 * protected print pages without full authentication
 */

import { randomBytes } from "crypto";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface PrintToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

// In-memory token store (for production, use Redis or database)
const tokenStore = new Map<string, PrintToken>();

/**
 * Generate a temporary print token (valid for 5 minutes)
 */
export function generatePrintToken(userId: string): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  tokenStore.set(token, {
    token,
    userId,
    expiresAt,
  });

  // Clean up expired tokens
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate a print token and return the userId
 */
export function validatePrintToken(token: string): string | null {
  const tokenData = tokenStore.get(token);

  if (!tokenData) {
    return null;
  }

  if (new Date() > tokenData.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  return tokenData.userId;
}

/**
 * Revoke a print token after use
 */
export function revokePrintToken(token: string): void {
  tokenStore.delete(token);
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
    }
  }
}
