import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, familyMembers } from "@/lib/db";
import { eq } from "drizzle-orm";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET /api/family/members - Get all family members for user
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    logger.api("Fetching family members for user:", user.id);

    // Get family members from database
    const members = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, user.id));

    return NextResponse.json(members);

  } catch (error) {
    logger.error("Family members fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch family members", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
