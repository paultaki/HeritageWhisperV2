import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, users, profiles } from "@/lib/db";
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

// GET /api/profile - Get user profile
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

    logger.api("Fetching profile for user:", user.id);

    // Get profile from database
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile) {
      // Return default profile data if none exists
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      return NextResponse.json({
        birthYear: dbUser?.birthYear || 1950,
        majorLifePhases: {
          childhood: { start: 0, end: 12 },
          youngAdult: { start: 13, end: 25 },
          midLife: { start: 26, end: 60 },
          senior: { start: 61, end: 100 }
        },
        workEthic: 5,
        riskTolerance: 5,
        familyOrientation: 5,
        spirituality: 5,
        preferredStyle: 'gentle',
        emotionalComfort: 5,
        detailLevel: 'moderate',
        followUpFrequency: 'occasional',
        completionPercentage: 0
      });
    }

    // Transform database format to frontend format
    return NextResponse.json({
      birthYear: profile.birthYear,
      majorLifePhases: profile.majorLifePhases || {
        childhood: { start: 0, end: 12 },
        youngAdult: { start: 13, end: 25 },
        midLife: { start: 26, end: 60 },
        senior: { start: 61, end: 100 }
      },
      workEthic: profile.workEthic || 5,
      riskTolerance: profile.riskTolerance || 5,
      familyOrientation: profile.familyOrientation || 5,
      spirituality: profile.spirituality || 5,
      preferredStyle: profile.preferredStyle || 'gentle',
      emotionalComfort: profile.emotionalComfort || 5,
      detailLevel: profile.detailLevel || 'moderate',
      followUpFrequency: profile.followUpFrequency || 'occasional',
      completionPercentage: profile.completionPercentage || 0
    });

  } catch (error) {
    logger.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
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

    const profileData = await request.json();

    logger.api("Updating profile for user:", user.id);

    // Calculate completion percentage
    let fieldsCompleted = 0;
    const totalFields = 12; // Total number of profile fields

    if (profileData.birthYear) fieldsCompleted++;
    if (profileData.majorLifePhases) fieldsCompleted++;
    if (profileData.workEthic && profileData.workEthic !== 5) fieldsCompleted++;
    if (profileData.riskTolerance && profileData.riskTolerance !== 5) fieldsCompleted++;
    if (profileData.familyOrientation && profileData.familyOrientation !== 5) fieldsCompleted++;
    if (profileData.spirituality && profileData.spirituality !== 5) fieldsCompleted++;
    if (profileData.preferredStyle && profileData.preferredStyle !== 'gentle') fieldsCompleted++;
    if (profileData.emotionalComfort && profileData.emotionalComfort !== 5) fieldsCompleted++;
    if (profileData.detailLevel && profileData.detailLevel !== 'moderate') fieldsCompleted++;
    if (profileData.followUpFrequency && profileData.followUpFrequency !== 'occasional') fieldsCompleted++;

    const completionPercentage = Math.round((fieldsCompleted / totalFields) * 100);

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(profiles)
        .set({
          ...profileData,
          completionPercentage,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, user.id))
        .returning();

      return NextResponse.json({
        success: true,
        completionPercentage,
        profile: updatedProfile
      });
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          ...profileData,
          completionPercentage,
        })
        .returning();

      return NextResponse.json({
        success: true,
        completionPercentage,
        profile: newProfile
      });
    }

  } catch (error) {
    logger.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to save profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/profile - Alias for PATCH (backward compatibility)
export async function POST(request: NextRequest) {
  return PATCH(request);
}
