import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { authRatelimit, getClientIp, checkRateLimit } from "@/lib/ratelimit";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function POST(request: NextRequest) {
  // Rate limiting: 5 attempts per 10 seconds per IP
  const clientIp = getClientIp(request);
  const rateLimitResponse = await checkRateLimit(
    `login:${clientIp}`,
    authRatelimit,
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Debug: Log the attempt (NEVER log PII like emails)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Login attempt received');
      logger.info(`Supabase URL: ${supabaseUrl}`);
      logger.info(`Anon key present: ${!!supabaseAnonKey}`);
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      // Log error without exposing PII
      logger.error("Supabase login error:", error.message);

      // Check if it's an email not confirmed error
      if (
        error.message?.includes("Email not confirmed") ||
        error.message?.includes("email_not_confirmed")
      ) {
        return NextResponse.json(
          {
            error: "Please confirm your email address",
            details:
              "We sent you a confirmation email. Please check your inbox and click the link to verify your account.",
            code: "EMAIL_NOT_CONFIRMED",
          },
          { status: 401 },
        );
      }

      // Check if it's invalid credentials
      if (
        error.message?.includes("Invalid login credentials") ||
        error.message?.includes("invalid_grant")
      ) {
        return NextResponse.json(
          {
            error: "Invalid email or password",
            details: "Please check your credentials and try again.",
            code: "INVALID_CREDENTIALS",
          },
          { status: 401 },
        );
      }

      // Generic error
      return NextResponse.json(
        { error: error.message || "Login failed. Please try again." },
        { status: 401 },
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    // Return user data from Supabase Auth metadata
    // This simplified version doesn't require a separate database
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name:
        data.user.user_metadata?.name ||
        data.user.email?.split("@")[0] ||
        "User",
      birthYear:
        data.user.user_metadata?.birthYear || new Date().getFullYear() - 50,
      storyCount: 0,
      isPaid: false,
    };

    return NextResponse.json({
      user: userData,
      session: data.session,
    });
  } catch (error) {
    // Log error without exposing PII or credentials
    logger.error("Login error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
