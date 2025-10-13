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

    // Get user data from database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError) {
      logger.error("Error fetching user from database:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 },
      );
    }

    // Return user profile data from database
    const profile = {
      id: dbUser.id,
      email: user.email,
      name: dbUser.name || user.email?.split("@")[0] || "User",
      birthYear: dbUser.birth_year || new Date().getFullYear() - 30,
      bio: dbUser.bio || "",
      profilePhotoUrl: dbUser.profile_photo_url || "",
      emailNotifications: dbUser.email_notifications ?? true,
      weeklyDigest: dbUser.weekly_digest ?? true,
      familyComments: dbUser.family_comments ?? true,
      printedBooksNotify: dbUser.printed_books_notify ?? false,
      defaultStoryVisibility: dbUser.default_story_visibility ?? true,
      storyCount: dbUser.story_count || 0,
      isPaid: dbUser.is_paid || false,
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

    // Build database update object
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.birthYear !== undefined) dbUpdates.birth_year = updates.birthYear;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.profilePhotoUrl !== undefined) dbUpdates.profile_photo_url = updates.profilePhotoUrl;
    
    // Notification preferences
    if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications;
    if (updates.weeklyDigest !== undefined) dbUpdates.weekly_digest = updates.weeklyDigest;
    if (updates.familyComments !== undefined) dbUpdates.family_comments = updates.familyComments;
    if (updates.printedBooksNotify !== undefined) dbUpdates.printed_books_notify = updates.printedBooksNotify;
    
    // Privacy settings
    if (updates.defaultStoryVisibility !== undefined) dbUpdates.default_story_visibility = updates.defaultStoryVisibility;

    // Update database
    const { data: dbUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update(dbUpdates)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      logger.error("Failed to update user in database:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Also update auth metadata for backward compatibility
    if (updates.name !== undefined || updates.birthYear !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name: updates.name,
          birthYear: updates.birthYear,
        },
      });
    }

    // Return updated profile
    const updatedProfile = {
      id: dbUser.id,
      email: user.email,
      name: dbUser.name || user.email?.split("@")[0] || "User",
      birthYear: dbUser.birth_year || new Date().getFullYear() - 30,
      bio: dbUser.bio || "",
      profilePhotoUrl: dbUser.profile_photo_url || "",
      emailNotifications: dbUser.email_notifications ?? true,
      weeklyDigest: dbUser.weekly_digest ?? true,
      familyComments: dbUser.family_comments ?? true,
      printedBooksNotify: dbUser.printed_books_notify ?? false,
      defaultStoryVisibility: dbUser.default_story_visibility ?? true,
      storyCount: dbUser.story_count || 0,
      isPaid: dbUser.is_paid || false,
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
