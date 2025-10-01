import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

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
        { error: "Authentication required. Please sign in again." },
        { status: 401 }
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      // Check if it's an expired token error
      if (error.message.includes("expired") || error.message.includes("JWT")) {
        return NextResponse.json(
          {
            error: "Session expired",
            details: "Your session has expired. Please sign in again.",
            code: "SESSION_EXPIRED",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: "Invalid authentication",
          details: error.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid token",
          details: "Token does not correspond to a valid user",
        },
        { status: 401 }
      );
    }

    // Get user from PostgreSQL database
    let dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      logger.api("User not found in database, creating:", user.id);

      // Create user in database if they don't exist
      try {
        const newUser = await db
          .insert(users)
          .values({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            birthYear: user.user_metadata?.birthYear || new Date().getFullYear() - 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        dbUser = newUser;
        logger.api("User created successfully:", user.id);
      } catch (createError) {
        logger.error("Error creating user:", createError);
        // Return basic user data if database creation fails
        const userData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          birthYear: user.user_metadata?.birthYear || new Date().getFullYear() - 50,
          storyCount: 0,
          isPaid: false,
        };
        return NextResponse.json({ user: userData });
      }
    }

    // Return user data from database
    const userFromDb = dbUser[0];
    const userData = {
      id: userFromDb.id,
      email: userFromDb.email,
      name: userFromDb.name,
      birthYear: userFromDb.birthYear,
      storyCount: userFromDb.storyCount || 0,
      isPaid: userFromDb.isPaid || false,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    logger.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}