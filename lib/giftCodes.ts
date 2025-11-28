/**
 * Gift Codes Helper Module
 *
 * Server-side only functions for managing gift subscription codes.
 * WARNING: Only import this in API routes and server-side code.
 */

import { supabaseAdmin } from './supabaseAdmin';

// Safe character set excluding confusing characters (0/O, I/1/l)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Gift code format: GIFT-XXXX-XXXX-XXXX (16 chars total with dashes)
 */
const CODE_SEGMENT_LENGTH = 4;
const CODE_SEGMENTS = 3;

export type GiftCodeStatus = 'pending' | 'active' | 'redeemed' | 'expired' | 'refunded';

/**
 * Database row type for gift_codes table (snake_case from Supabase)
 */
export interface GiftCodeRow {
  id: string;
  code: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_paid_cents: number;
  purchaser_email: string;
  purchaser_name: string | null;
  purchaser_user_id: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  redeemed_by_user_id: string | null;
  redeemed_at: string | null;
  status: GiftCodeStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Application type for gift codes (camelCase for frontend use)
 */
export interface GiftCode {
  id: string;
  code: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  amountPaidCents: number;
  purchaserEmail: string;
  purchaserName: string | null;
  purchaserUserId: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  redeemedByUserId: string | null;
  redeemedAt: string | null;
  status: GiftCodeStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert database row to application type
 */
function mapRowToGiftCode(row: GiftCodeRow): GiftCode {
  return {
    id: row.id,
    code: row.code,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    amountPaidCents: row.amount_paid_cents,
    purchaserEmail: row.purchaser_email,
    purchaserName: row.purchaser_name,
    purchaserUserId: row.purchaser_user_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    redeemedByUserId: row.redeemed_by_user_id,
    redeemedAt: row.redeemed_at,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GiftCodeValidationResult {
  valid: boolean;
  giftCode?: GiftCode;
  error?: string;
}

export interface GiftCodeCreateParams {
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string;
  purchaserEmail: string;
  purchaserName?: string;
  purchaserUserId?: string;
  amountPaidCents?: number;
}

export interface GiftCodeRedeemResult {
  success: boolean;
  giftCode?: GiftCode;
  isExtension: boolean; // true if extending existing subscription
  newExpirationDate: Date;
  error?: string;
}

/**
 * Generate a random code segment using safe characters
 */
function generateSegment(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((byte) => SAFE_CHARS[byte % SAFE_CHARS.length])
    .join('');
}

/**
 * Generate a gift code in format: GIFT-XXXX-XXXX-XXXX
 */
export function generateGiftCode(): string {
  const segments = Array.from({ length: CODE_SEGMENTS }, () =>
    generateSegment(CODE_SEGMENT_LENGTH)
  );
  return `GIFT-${segments.join('-')}`;
}

/**
 * Normalize a gift code (handle with/without dashes, case insensitivity)
 * Returns format: GIFT-XXXX-XXXX-XXXX
 */
export function normalizeGiftCode(code: string): string {
  // Remove all non-alphanumeric chars and uppercase
  const cleaned = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // If it starts with GIFT, the format should be GIFT + 12 chars
  if (cleaned.startsWith('GIFT') && cleaned.length === 16) {
    const chars = cleaned.slice(4); // Remove 'GIFT'
    return `GIFT-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
  }

  // If just 12 chars, add GIFT prefix
  if (cleaned.length === 12) {
    return `GIFT-${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  }

  // Return original with standard format attempt
  return code.toUpperCase().trim();
}

/**
 * Validate a gift code
 * Checks if code exists, is active, and not expired
 */
export async function validateGiftCode(code: string): Promise<GiftCodeValidationResult> {
  const normalizedCode = normalizeGiftCode(code);

  if (!normalizedCode || normalizedCode.length < 16) {
    return { valid: false, error: 'Invalid gift code format' };
  }

  const { data: row, error } = await supabaseAdmin
    .from('gift_codes')
    .select('*')
    .eq('code', normalizedCode)
    .single();

  if (error || !row) {
    return { valid: false, error: 'Gift code not found' };
  }

  const giftCode = mapRowToGiftCode(row as GiftCodeRow);

  // Check if already redeemed
  if (giftCode.status === 'redeemed') {
    return { valid: false, error: 'This gift code has already been redeemed', giftCode };
  }

  // Check if refunded
  if (giftCode.status === 'refunded') {
    return { valid: false, error: 'This gift code has been refunded', giftCode };
  }

  // Check if expired
  if (giftCode.status === 'expired') {
    return { valid: false, error: 'This gift code has expired', giftCode };
  }

  // Check expiration date
  const expiresAt = new Date(giftCode.expiresAt);
  if (expiresAt < new Date()) {
    // Update status to expired
    await supabaseAdmin
      .from('gift_codes')
      .update({ status: 'expired' })
      .eq('id', giftCode.id);

    return { valid: false, error: 'This gift code has expired', giftCode };
  }

  // Check if pending (payment not completed)
  if (giftCode.status === 'pending') {
    return { valid: false, error: 'This gift code is not yet active', giftCode };
  }

  return { valid: true, giftCode };
}

/**
 * Create a new gift code after successful payment
 * Called from Stripe webhook after checkout.session.completed
 */
export async function createGiftCode(params: GiftCodeCreateParams): Promise<GiftCode> {
  const code = generateGiftCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Gift codes expire 1 year from purchase

  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .insert({
      code,
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      stripe_payment_intent_id: params.stripePaymentIntentId || null,
      purchaser_email: params.purchaserEmail,
      purchaser_name: params.purchaserName || null,
      purchaser_user_id: params.purchaserUserId || null,
      amount_paid_cents: params.amountPaidCents || 7900,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating gift code:', error);
    throw new Error('Failed to create gift code');
  }

  return mapRowToGiftCode(data as GiftCodeRow);
}

/**
 * Get gift code by Stripe checkout session ID
 * Used on success page to display the code
 */
export async function getGiftCodeBySessionId(sessionId: string): Promise<GiftCode | null> {
  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .select('*')
    .eq('stripe_checkout_session_id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapRowToGiftCode(data as GiftCodeRow);
}

/**
 * Get gift codes purchased by a user
 */
export async function getPurchasedGiftCodes(userId: string): Promise<GiftCode[]> {
  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .select('*')
    .eq('purchaser_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchased gift codes:', error);
    return [];
  }

  return (data || []).map((row) => mapRowToGiftCode(row as GiftCodeRow));
}

/**
 * Redeem a gift code for a user
 * - For new users: sets is_paid = true, creates stripe_customers record
 * - For existing subscribers: extends their subscription by 1 year
 */
export async function redeemGiftCode(
  code: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<GiftCodeRedeemResult> {
  // Validate the code first
  const validation = await validateGiftCode(code);
  if (!validation.valid || !validation.giftCode) {
    return {
      success: false,
      isExtension: false,
      newExpirationDate: new Date(),
      error: validation.error || 'Invalid gift code',
    };
  }

  const giftCode = validation.giftCode;

  // Start a transaction by doing all updates
  const now = new Date();

  // Check if user already has an active subscription
  const { data: existingCustomer } = await supabaseAdmin
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .single();

  let newExpirationDate: Date;
  let isExtension = false;

  if (existingCustomer && existingCustomer.status === 'active' && existingCustomer.current_period_end) {
    // Extend existing subscription by 1 year
    const currentEnd = new Date(existingCustomer.current_period_end);
    newExpirationDate = new Date(currentEnd);
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
    isExtension = true;

    // Update stripe_customers with new end date
    const { error: updateError } = await supabaseAdmin
      .from('stripe_customers')
      .update({
        current_period_end: newExpirationDate.toISOString(),
        plan_type: 'gift_annual',
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error extending subscription:', updateError);
      return {
        success: false,
        isExtension: false,
        newExpirationDate: new Date(),
        error: 'Failed to extend subscription',
      };
    }
  } else {
    // New subscription - set expiration to 1 year from now
    newExpirationDate = new Date(now);
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);

    // Create or update stripe_customers record
    const customerData = {
      user_id: userId,
      stripe_customer_id: `gift_${giftCode.id}`, // Placeholder since no actual Stripe customer
      status: 'active',
      plan_type: 'gift_annual',
      current_period_start: now.toISOString(),
      current_period_end: newExpirationDate.toISOString(),
      cancel_at_period_end: false,
    };

    if (existingCustomer) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('stripe_customers')
        .update({
          ...customerData,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating stripe_customers:', updateError);
        return {
          success: false,
          isExtension: false,
          newExpirationDate: new Date(),
          error: 'Failed to activate subscription',
        };
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from('stripe_customers')
        .insert({
          ...customerData,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });

      if (insertError) {
        console.error('Error creating stripe_customers:', insertError);
        return {
          success: false,
          isExtension: false,
          newExpirationDate: new Date(),
          error: 'Failed to activate subscription',
        };
      }
    }

    // Update user's is_paid status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        is_paid: true,
        subscription_status: 'active',
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user is_paid:', userError);
      // Continue anyway - the stripe_customers record is authoritative
    }
  }

  // Mark gift code as redeemed
  const { data: updatedGiftCode, error: redeemError } = await supabaseAdmin
    .from('gift_codes')
    .update({
      status: 'redeemed',
      redeemed_by_user_id: userId,
      redeemed_at: now.toISOString(),
      recipient_email: userEmail,
      recipient_name: userName || null,
    })
    .eq('id', giftCode.id)
    .eq('status', 'active') // Only update if still active (prevent double redemption)
    .select()
    .single();

  if (redeemError || !updatedGiftCode) {
    console.error('Error marking gift code as redeemed:', redeemError);
    return {
      success: false,
      isExtension: false,
      newExpirationDate: new Date(),
      error: 'Failed to redeem gift code - it may have already been used',
    };
  }

  return {
    success: true,
    giftCode: mapRowToGiftCode(updatedGiftCode as GiftCodeRow),
    isExtension,
    newExpirationDate,
  };
}

/**
 * Mark a gift code as refunded
 * Called when a refund is processed
 */
export async function markGiftCodeRefunded(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('gift_codes')
    .update({ status: 'refunded' })
    .eq('stripe_checkout_session_id', sessionId)
    .eq('status', 'active'); // Only refund active codes

  if (error) {
    console.error('Error marking gift code as refunded:', error);
    throw new Error('Failed to mark gift code as refunded');
  }
}

/**
 * Get gift code details for purchaser viewing
 * Returns sanitized data safe to show to purchaser
 */
export async function getGiftCodeForPurchaser(
  codeId: string,
  purchaserUserId: string
): Promise<GiftCode | null> {
  const { data, error } = await supabaseAdmin
    .from('gift_codes')
    .select('*')
    .eq('id', codeId)
    .eq('purchaser_user_id', purchaserUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapRowToGiftCode(data as GiftCodeRow);
}
