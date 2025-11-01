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

// POST /api/auth/change-password - Change user password
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
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Only log in development - no PII in production
    if (process.env.NODE_ENV === 'development') {
      logger.api("Changing password for user:", authUser.id);
    }

    // Get user email from Supabase Auth to verify current password
    const { data: { user: authUserData }, error: userFetchError } = 
      await supabaseAdmin.auth.admin.getUserById(authUser.id);

    if (userFetchError || !authUserData) {
      logger.error("User lookup error:", userFetchError?.message || 'User not found');
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Verify current password by attempting sign-in
    // This is the correct way - matching forgot password flow
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: authUserData.email!,
      password: currentPassword,
    });

    if (verifyError) {
      logger.warn("Current password verification failed");
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Update password using Supabase Auth admin API
    // This is how reset-password works - we use the same pattern
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      logger.error("Password update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Password change error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: "Failed to change password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
