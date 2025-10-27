/**
 * Database Admin Utilities for Passkey Management
 *
 * This module provides database operations using the Supabase service role key,
 * which bypasses Row Level Security (RLS) for passkey registration and verification.
 */

import { createClient } from "@supabase/supabase-js";
import type { Passkey, InsertPasskey } from "@/shared/schema";

// Admin client with service role key (bypasses RLS)
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration for admin client");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Get user by email (for passkey registration)
 */
export async function getUserByEmail(
  email: string
): Promise<{ id: string; email: string } | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (error) {
    console.error("[getUserByEmail] Error:", error);
    return null;
  }

  return data;
}

/**
 * Get user by ID
 */
export async function getUserById(
  userId: string
): Promise<{
  id: string;
  email: string;
  name: string;
  birthYear: number;
  storyCount: number;
  isPaid: boolean;
} | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, birth_year, story_count, is_paid")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[getUserById] Error:", error);
    return null;
  }

  // Map snake_case to camelCase
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    birthYear: data.birth_year,
    storyCount: data.story_count || 0,
    isPaid: data.is_paid || false,
  };
}

/**
 * Create a new passkey
 */
export async function createPasskey(
  passkey: InsertPasskey
): Promise<Passkey | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("passkeys")
    .insert({
      user_id: passkey.userId,
      credential_id: passkey.credentialId,
      public_key: passkey.publicKey,
      sign_count: passkey.signCount,
      credential_backed_up: passkey.credentialBackedUp,
      credential_device_type: passkey.credentialDeviceType,
      transports: passkey.transports,
      friendly_name: passkey.friendlyName,
    })
    .select()
    .single();

  if (error) {
    console.error("[createPasskey] Error:", error);
    return null;
  }

  // Map snake_case to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    credentialId: data.credential_id,
    publicKey: data.public_key,
    signCount: data.sign_count,
    credentialBackedUp: data.credential_backed_up,
    credentialDeviceType: data.credential_device_type,
    transports: data.transports,
    friendlyName: data.friendly_name,
    createdAt: data.created_at,
    lastUsedAt: data.last_used_at,
  };
}

/**
 * Get passkey by credential ID
 */
export async function getPasskeyByCredentialId(
  credentialId: string
): Promise<Passkey | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("passkeys")
    .select("*")
    .eq("credential_id", credentialId)
    .single();

  if (error) {
    console.error("[getPasskeyByCredentialId] Error:", error);
    return null;
  }

  // Map snake_case to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    credentialId: data.credential_id,
    publicKey: data.public_key,
    signCount: data.sign_count,
    credentialBackedUp: data.credential_backed_up,
    credentialDeviceType: data.credential_device_type,
    transports: data.transports,
    friendlyName: data.friendly_name,
    createdAt: data.created_at,
    lastUsedAt: data.last_used_at,
  };
}

/**
 * Update passkey counter and last used timestamp
 */
export async function updatePasskeyCounter(
  credentialId: string,
  newCounter: number
): Promise<boolean> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("passkeys")
    .update({
      sign_count: newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("credential_id", credentialId);

  if (error) {
    console.error("[updatePasskeyCounter] Error:", error);
    return false;
  }

  return true;
}

/**
 * Get all passkeys for a user
 */
export async function getUserPasskeys(userId: string): Promise<Passkey[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("passkeys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserPasskeys] Error:", error);
    return [];
  }

  // Map snake_case to camelCase
  return data.map((item) => ({
    id: item.id,
    userId: item.user_id,
    credentialId: item.credential_id,
    publicKey: item.public_key,
    signCount: item.sign_count,
    credentialBackedUp: item.credential_backed_up,
    credentialDeviceType: item.credential_device_type,
    transports: item.transports,
    friendlyName: item.friendly_name,
    createdAt: item.created_at,
    lastUsedAt: item.last_used_at,
  }));
}

/**
 * Delete a passkey
 */
export async function deletePasskey(
  userId: string,
  passkeyId: string
): Promise<boolean> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("passkeys")
    .delete()
    .eq("id", passkeyId)
    .eq("user_id", userId); // Ensure user owns the passkey

  if (error) {
    console.error("[deletePasskey] Error:", error);
    return false;
  }

  return true;
}

/**
 * Update passkey friendly name
 */
export async function updatePasskeyName(
  userId: string,
  passkeyId: string,
  friendlyName: string
): Promise<boolean> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("passkeys")
    .update({ friendly_name: friendlyName })
    .eq("id", passkeyId)
    .eq("user_id", userId); // Ensure user owns the passkey

  if (error) {
    console.error("[updatePasskeyName] Error:", error);
    return false;
  }

  return true;
}
