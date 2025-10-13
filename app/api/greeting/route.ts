/**
 * GET /api/greeting
 * 
 * Returns personalized greeting based on user context
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateGreeting, getUserContext, recordGreeting } from "@/lib/greetingSystem";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Get user context
    const context = await getUserContext(supabaseAdmin, user.id);
    
    // Generate greeting
    const greeting = generateGreeting(context);
    
    // Record greeting to prevent repeats
    recordGreeting(user.id, greeting.full);
    
    logger.debug("[Greeting API] Generated greeting for user:", user.id);

    return NextResponse.json({
      greeting: greeting.full,
      components: {
        salutation: greeting.salutation,
        continuation: greeting.continuation,
        nudge: greeting.nudge,
      },
    });

  } catch (err) {
    logger.error("Error in GET /api/greeting:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
