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
        logger.error("Error creating user in public.users:", insertError);
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
    logger.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
