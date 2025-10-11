import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header for the current session
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // No session to logout from, but that's okay
      return NextResponse.json({ success: true });
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Logout error:", error);
      // Even if there's an error, we consider logout successful
      // as the client will clear the session
    }

    logger.api("User logged out successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Logout error:", error);
    // Even on error, return success to clear client session
    return NextResponse.json({ success: true });
  }
}
