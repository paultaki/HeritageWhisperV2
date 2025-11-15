/**
 * Beta Codes Helper Module
 * 
 * Server-side only functions for managing beta invite codes.
 * WARNING: Only import this in API routes and server-side code.
 */

import { supabaseAdmin } from './supabaseAdmin';

// Safe character set excluding confusing characters (0/O, I/1)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface BetaCode {
  id: string;
  code: string;
  issued_to_user_id: string | null;
  used_by_user_id: string | null;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
}

/**
 * Generate a random code using safe characters
 */
export function generateCode(length = 8): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array)
    .map(byte => SAFE_CHARS[byte % SAFE_CHARS.length])
    .join('');
}

/**
 * Validate a beta code
 * Checks if code exists, is unused, not revoked, and not expired
 * 
 * @throws Error if code is invalid, used, expired, or revoked
 */
export async function validateBetaCode(code: string): Promise<BetaCode> {
  // Normalize the code
  const normalizedCode = code.trim().toUpperCase();
  
  if (!normalizedCode) {
    throw new Error('Beta access code is required');
  }

  // Query the beta_codes table
  const { data: betaCode, error } = await supabaseAdmin
    .from('beta_codes')
    .select('*')
    .eq('code', normalizedCode)
    .single();

  if (error || !betaCode) {
    throw new Error('Invalid beta access code');
  }

  // Check if already used
  if (betaCode.used_by_user_id) {
    throw new Error('This code has already been used');
  }

  // Check if revoked
  if (betaCode.revoked) {
    throw new Error('This code has been revoked');
  }

  // Check if expired
  if (betaCode.expires_at) {
    const expiryDate = new Date(betaCode.expires_at);
    if (expiryDate < new Date()) {
      throw new Error('This code has expired');
    }
  }

  return betaCode;
}

/**
 * Mark a beta code as used
 * Updates the code with the user who used it and timestamp
 */
export async function markBetaCodeUsed(
  codeId: string,
  userId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('beta_codes')
    .update({
      used_by_user_id: userId,
      used_at: new Date().toISOString(),
    })
    .eq('id', codeId)
    .is('used_by_user_id', null); // Only update if not already used

  if (error) {
    console.error('Error marking beta code as used:', error);
    throw new Error('Failed to mark beta code as used');
  }
}

/**
 * Create invite codes for a new user
 * Generates N codes and assigns them to the user
 * 
 * @param userId - The user to assign codes to
 * @param count - Number of codes to generate (default 3)
 * @returns Array of generated code strings
 */
export async function createInviteCodesForUser(
  userId: string,
  count = 3
): Promise<string[]> {
  // Check if user already has codes
  const { data: existingCodes } = await supabaseAdmin
    .from('beta_codes')
    .select('id')
    .eq('issued_to_user_id', userId)
    .limit(1);

  // If they already have codes, don't create more
  if (existingCodes && existingCodes.length > 0) {
    console.log(`User ${userId} already has beta codes, skipping creation`);
    return [];
  }

  // Generate new codes
  const codes = Array.from({ length: count }, () => generateCode());

  // Insert codes into database
  const codesToInsert = codes.map(code => ({
    code,
    issued_to_user_id: userId,
  }));

  const { data, error } = await supabaseAdmin
    .from('beta_codes')
    .insert(codesToInsert)
    .select('code');

  if (error) {
    console.error('Error creating invite codes:', error);
    throw new Error('Failed to create invite codes');
  }

  return data?.map(row => row.code) || [];
}

/**
 * Create generic beta codes (not assigned to any user)
 * Used by admins to generate codes for distribution
 * 
 * @param count - Number of codes to generate
 * @param expiresAt - Optional expiry date
 * @returns Array of generated code strings
 */
export async function createGenericBetaCodes(
  count: number,
  expiresAt?: string
): Promise<string[]> {
  const codes = Array.from({ length: count }, () => generateCode());

  const codesToInsert = codes.map(code => ({
    code,
    issued_to_user_id: null,
    expires_at: expiresAt || null,
  }));

  const { data, error } = await supabaseAdmin
    .from('beta_codes')
    .insert(codesToInsert)
    .select('code');

  if (error) {
    console.error('Error creating generic beta codes:', error);
    throw new Error('Failed to create beta codes');
  }

  return data?.map(row => row.code) || [];
}

/**
 * Revoke a beta code
 */
export async function revokeBetaCode(codeId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('beta_codes')
    .update({
      revoked: true,
      expires_at: new Date().toISOString(),
    })
    .eq('id', codeId);

  if (error) {
    console.error('Error revoking beta code:', error);
    throw new Error('Failed to revoke beta code');
  }
}
