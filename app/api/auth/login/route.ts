import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Supabase login error:", error);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Login failed" },
        { status: 401 }
      );
    }

    // Check if user exists in PostgreSQL database
    let dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, data.user.id))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      logger.api("Creating new user in database:", data.user.id);

      // Create user in database
      try {
        const newUser = await db
          .insert(users)
          .values({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            birthYear: data.user.user_metadata?.birthYear || new Date().getFullYear() - 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        dbUser = newUser;
        logger.api("User created successfully:", data.user.id);
      } catch (createError) {
        logger.error("Error creating user in database:", createError);
        // Continue with login even if user creation fails
        // User might already exist or there's another issue
      }
    }

    // Get actual user data from database (if it exists)
    const userFromDb = dbUser && dbUser.length > 0 ? dbUser[0] : null;

    // Return user data and session
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: userFromDb?.name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
      birthYear: userFromDb?.birthYear || data.user.user_metadata?.birthYear || new Date().getFullYear() - 50,
      storyCount: userFromDb?.storyCount || 0,
      isPaid: userFromDb?.isPaid || false,
    };

    return NextResponse.json({
      user: userData,
      session: data.session,
    });
  } catch (error) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}