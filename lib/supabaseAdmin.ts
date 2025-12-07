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
// Build Phase Detection
// =============================================================================

/**
 * Check if we're in the Next.js build phase.
 * During build, runtime secrets aren't available.
 */
function isBuildPhase(): boolean {
  const phase = process.env.NEXT_PHASE;
  if (phase === 'phase-production-build' || phase === 'phase-export') {
    return true;
  }
  if ((process.env.CI === '1' || process.env.VERCEL === '1') && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return true;
  }
  return false;
}

// =============================================================================
// Lazy-Initialized Admin Client
// =============================================================================

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the Supabase Admin client with full database privileges.
 * Uses lazy initialization to avoid build-time errors.
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
function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

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

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      // Disable session persistence - this is a server-side client
      persistSession: false,
      // Disable auto-refresh - no browser context
      autoRefreshToken: false,
    },
  });

  return _supabaseAdmin;
}

// Export a proxy that lazily initializes the client on first use
// This maintains backward compatibility with existing code that uses supabaseAdmin directly
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // During build phase, return a mock that won't throw
    if (isBuildPhase()) {
      // Return a no-op function for method calls during build
      return () => Promise.resolve({ data: null, error: null });
    }
    const client = getSupabaseAdmin();
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// =============================================================================
// Type Exports for Convenience
// =============================================================================

export type { SupabaseClient };
