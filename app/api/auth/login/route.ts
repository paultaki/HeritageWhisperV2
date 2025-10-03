import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Debug: Log the attempt (without password)
    logger.info(`Login attempt for email: ${email}`);
    logger.info(`Supabase URL: ${supabaseUrl}`);
    logger.info(`Anon key present: ${!!supabaseAnonKey}`);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
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

    // Return user data from Supabase Auth metadata
    // This simplified version doesn't require a separate database
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
      birthYear: data.user.user_metadata?.birthYear || new Date().getFullYear() - 50,
      storyCount: 0,
      isPaid: false,
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