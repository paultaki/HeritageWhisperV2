import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/profile - Get user profile
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
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Get user data from Supabase public.users table
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !dbUser) {
      logger.error("Error fetching user:", userError);
      // Return default profile data
      return NextResponse.json({
        birthYear: user.user_metadata?.birthYear || 1950,
        majorLifePhases: {
          childhood: { start: 0, end: 12 },
          youngAdult: { start: 13, end: 25 },
          midLife: { start: 26, end: 60 },
          senior: { start: 61, end: 100 },
        },
        workEthic: 5,
        riskTolerance: 5,
        familyOrientation: 5,
        spirituality: 5,
        preferredStyle: "gentle",
        emotionalComfort: 5,
        detailLevel: "moderate",
        followUpFrequency: "occasional",
        completionPercentage: 0,
      });
    }

    // Return profile data from user metadata and defaults
    // Note: In a full implementation, you might want to create a separate profiles table
    return NextResponse.json({
      birthYear: dbUser.birth_year || 1950,
      majorLifePhases: user.user_metadata?.majorLifePhases || {
        childhood: { start: 0, end: 12 },
        youngAdult: { start: 13, end: 25 },
        midLife: { start: 26, end: 60 },
        senior: { start: 61, end: 100 },
      },
      workEthic: user.user_metadata?.workEthic || 5,
      riskTolerance: user.user_metadata?.riskTolerance || 5,
      familyOrientation: user.user_metadata?.familyOrientation || 5,
      spirituality: user.user_metadata?.spirituality || 5,
      preferredStyle: user.user_metadata?.preferredStyle || "gentle",
      emotionalComfort: user.user_metadata?.emotionalComfort || 5,
      detailLevel: user.user_metadata?.detailLevel || "moderate",
      followUpFrequency: user.user_metadata?.followUpFrequency || "occasional",
      completionPercentage: user.user_metadata?.completionPercentage || 0,
    });
  } catch (error) {
    logger.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
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
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    const profileData = await request.json();

    // Calculate completion percentage
    let fieldsCompleted = 0;
    const totalFields = 10; // Total number of profile fields

    if (profileData.birthYear) fieldsCompleted++;
    if (profileData.majorLifePhases) fieldsCompleted++;
    if (profileData.workEthic && profileData.workEthic !== 5) fieldsCompleted++;
    if (profileData.riskTolerance && profileData.riskTolerance !== 5)
      fieldsCompleted++;
    if (profileData.familyOrientation && profileData.familyOrientation !== 5)
      fieldsCompleted++;
    if (profileData.spirituality && profileData.spirituality !== 5)
      fieldsCompleted++;
    if (profileData.preferredStyle && profileData.preferredStyle !== "gentle")
      fieldsCompleted++;
    if (profileData.emotionalComfort && profileData.emotionalComfort !== 5)
      fieldsCompleted++;
    if (profileData.detailLevel && profileData.detailLevel !== "moderate")
      fieldsCompleted++;
    if (
      profileData.followUpFrequency &&
      profileData.followUpFrequency !== "occasional"
    )
      fieldsCompleted++;

    const completionPercentage = Math.round(
      (fieldsCompleted / totalFields) * 100,
    );

    // Update user metadata in Supabase Auth
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...profileData,
          completionPercentage,
        },
      });

    if (updateError) {
      logger.error("Error updating user metadata:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Update birth_year in users table if provided
    if (profileData.birthYear) {
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          birth_year: profileData.birthYear,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (userUpdateError) {
        logger.error("Error updating user birth year:", userUpdateError);
        // Don't fail the request, metadata was updated successfully
      }
    }

    return NextResponse.json({
      success: true,
      completionPercentage,
      profile: {
        ...profileData,
        completionPercentage,
      },
    });
  } catch (error) {
    logger.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}

// POST /api/profile - Alias for PATCH (backward compatibility)
export async function POST(request: NextRequest) {
  return PATCH(request);
}
