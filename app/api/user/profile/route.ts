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

    // Return user profile data from auth metadata
    const profile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      birthYear: user.user_metadata?.birthYear || new Date().getFullYear() - 30,
      bio: user.user_metadata?.bio || "",
      profilePhotoUrl: user.user_metadata?.profilePhotoUrl || "",
      storyCount: user.user_metadata?.storyCount || 0,
      isPaid: user.user_metadata?.isPaid || false,
    };

    return NextResponse.json({ user: profile });
  } catch (error) {
    logger.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    const updates = await request.json();

    logger.api("Updating user profile:", user.id, updates);

    // Update Supabase user metadata
    const updatedMetadata = {
      ...user.user_metadata,
    };

    if (updates.name !== undefined) updatedMetadata.name = updates.name;
    if (updates.birthYear !== undefined)
      updatedMetadata.birthYear = updates.birthYear;
    if (updates.bio !== undefined) updatedMetadata.bio = updates.bio;
    if (updates.profilePhotoUrl !== undefined)
      updatedMetadata.profilePhotoUrl = updates.profilePhotoUrl;

    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: updatedMetadata,
      });

    if (updateError) {
      logger.error("Failed to update user metadata:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Return updated profile
    const updatedProfile = {
      id: updatedUser.user.id,
      email: updatedUser.user.email,
      name:
        updatedUser.user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User",
      birthYear:
        updatedUser.user.user_metadata?.birthYear ||
        new Date().getFullYear() - 30,
      bio: updatedUser.user.user_metadata?.bio || "",
      profilePhotoUrl: updatedUser.user.user_metadata?.profilePhotoUrl || "",
      storyCount: updatedUser.user.user_metadata?.storyCount || 0,
      isPaid: updatedUser.user.user_metadata?.isPaid || false,
    };

    return NextResponse.json({ user: updatedProfile });
  } catch (error) {
    logger.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
