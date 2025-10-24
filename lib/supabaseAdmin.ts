/**
 * Server-only Supabase Admin Client
 *
 * WARNING: This file should ONLY be imported by API routes and server-side code.
 * Never import this in client-side components or it will expose the service role key.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
}

// Admin client with full privileges (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
