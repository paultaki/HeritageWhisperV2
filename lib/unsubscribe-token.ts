import crypto from 'crypto';

/**
 * Generate an unsubscribe token for a family member
 * Format: {familyMemberId}.{hmacSignature}
 *
 * This is used by email templates to create unsubscribe links
 */
export function generateUnsubscribeToken(familyMemberId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(familyMemberId);
  const signature = hmac.digest('hex');
  return `${familyMemberId}.${signature}`;
}

/**
 * Verify an unsubscribe token and extract the family member ID
 * Returns the family member ID if valid, null otherwise
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const [familyMemberId, providedSignature] = token.split('.');

    if (!familyMemberId || !providedSignature) {
      return null;
    }

    // Regenerate the signature
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const hmac = crypto.createHmac('sha256', secret);
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
