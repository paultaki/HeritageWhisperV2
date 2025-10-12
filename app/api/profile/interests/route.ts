import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
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

    // Parse request body
    const interests = await request.json();

    // Validate interests structure
    if (typeof interests !== 'object' || !interests) {
      return NextResponse.json(
        { error: "Invalid interests format" },
        { status: 400 },
      );
    }

    // Update user's profile_interests in database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        profile_interests: interests,
      })
      .eq("id", user.id);

    if (updateError) {
      logger.error("Error updating profile interests:", updateError);
      return NextResponse.json(
        { error: "Failed to save interests" },
        { status: 500 },
      );
    }

    logger.debug("[Profile Interests] Saved for user:", user.id);

    // TODO: Trigger interest-based prompt generation
    // This could be done via a background job or immediate generation

    return NextResponse.json({
      success: true,
      message: "Interests saved successfully",
    });

  } catch (err) {
    logger.error("Error in POST /api/profile/interests:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    // Fetch user's profile interests
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("profile_interests")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      logger.error("Error fetching profile interests:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch interests" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      interests: userData?.profile_interests || {
        general: null,
        people: null,
        places: null,
      },
    });

  } catch (err) {
    logger.error("Error in GET /api/profile/interests:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
