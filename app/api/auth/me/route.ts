import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getPasskeySession } from "@/lib/iron-session";
import { getUserById } from "@/lib/db-admin";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // Try passkey session first (from iron-session cookie)
    const passkeySession = await getPasskeySession();

    if (passkeySession) {
      logger.info("[auth/me] Using passkey session");

      // Get user from database
      const user = await getUserById(passkeySession.userId);

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          birthYear: user.birthYear,
          storyCount: user.storyCount || 0,
          isPaid: user.isPaid || false,
        },
      });
    }

    // Fall back to Supabase session (Authorization header)
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

    // Get user from Supabase public.users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError || !dbUser) {
      // If user doesn't exist in public.users, create them
      const userData = {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        birth_year:
          user.user_metadata?.birthYear || new Date().getFullYear() - 50,
        story_count: 0,
        is_paid: false,
      };

      // Try to create the user
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        logger.error("Error creating user in public.users:", insertError.message);
        // Return basic data even if insert fails
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name:
              user.user_metadata?.name || user.email?.split("@")[0] || "User",
            birthYear:
              user.user_metadata?.birthYear || new Date().getFullYear() - 50,
            storyCount: 0,
            isPaid: false,
          },
        });
      }

      return NextResponse.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          birthYear: newUser.birth_year,
          storyCount: newUser.story_count || 0,
          isPaid: newUser.is_paid || false,
        },
      });
    }

    // Return user data from Supabase
    const userData = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      birthYear: dbUser.birth_year,
      storyCount: dbUser.story_count || 0,
      isPaid: dbUser.is_paid || false,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    logger.error("Auth verification error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
