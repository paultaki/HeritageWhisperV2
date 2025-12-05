/**
 * Server-only Supabase Admin Client
 *
 * SECURITY: This file uses the 'server-only' package to guarantee it can NEVER
 * be imported into client-side code. Attempting to import this in a "use client"
 * component will cause a build error.
 *
 * USE CASES (supabaseAdmin is appropriate):
 * - Webhooks (Stripe, etc.) where there's no user session
 * - Admin dashboards bypassing RLS for cross-user queries
 * - Cron jobs / background tasks
 * - Account deletion / data export (cross-table operations)
 * - Validating auth tokens (supabaseAdmin.auth.getUser)
 *
 * PREFER anon client + RLS when:
 * - User is querying their own data
 * - RLS policies already enforce access control
 * - You have a valid user session
 *
 * @module lib/supabaseAdmin
 */

import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Environment Variable Validation
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is required for Supabase Admin client"
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is required for admin operations. " +
      "This key should only exist in server-side environment variables."
  );
}

// =============================================================================
// Admin Client Instance
// =============================================================================

/**
 * Supabase Admin client with full database privileges.
 *
 * SECURITY WARNINGS:
 * - This client BYPASSES all Row Level Security (RLS) policies
 * - Only use in server-side code (API routes, webhooks, cron jobs)
 * - Never expose this client or its queries to client-side code
 * - Always validate user authorization before performing operations
 *
 * @example
 * // In an API route:
 * import { supabaseAdmin } from "@/lib/supabaseAdmin";
 *
 * const { data } = await supabaseAdmin
 *   .from("users")
 *   .select("*")
 *   .eq("id", userId);
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      // Disable session persistence - this is a server-side client
      persistSession: false,
      // Disable auto-refresh - no browser context
      autoRefreshToken: false,
    },
  }
);

// =============================================================================
// Type Exports for Convenience
// =============================================================================

export type { SupabaseClient };
