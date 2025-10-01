import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

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
        { status: 401 }
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
        { status: 401 }
      );
    }

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Return user profile data
    const profile = {
      id: user.id,
      email: user.email,
      name: dbUser?.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
      birthYear: dbUser?.birthYear || user.user_metadata?.birthYear || new Date().getFullYear() - 30,
      bio: dbUser?.bio || "",
      profilePhotoUrl: dbUser?.profilePhotoUrl || "",
      storyCount: dbUser?.storyCount || 0,
      isPaid: dbUser?.isPaid || false,
    };

    return NextResponse.json({ user: profile });
  } catch (error) {
    logger.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
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
        { status: 401 }
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
        { status: 401 }
      );
    }

    const updates = await request.json();

    logger.api("Updating user profile:", user.id, updates);

    // Update user in database
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.birthYear !== undefined) updateData.birthYear = updates.birthYear;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = updates.profilePhotoUrl;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    // Also update Supabase metadata for consistency
    await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          name: updates.name,
          birthYear: updates.birthYear,
        },
      }
    );

    // Return updated profile
    const updatedProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      birthYear: updatedUser.birthYear,
      bio: updatedUser.bio,
      profilePhotoUrl: updatedUser.profilePhotoUrl,
      storyCount: updatedUser.storyCount,
      isPaid: updatedUser.isPaid,
    };

    return NextResponse.json({ user: updatedProfile });
  } catch (error) {
    logger.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}