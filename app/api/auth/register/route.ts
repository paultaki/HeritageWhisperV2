import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, birthYear } = await request.json();

    if (!email || !password || !name || !birthYear) {
      return NextResponse.json(
        { error: "Email, password, name, and birth year are required" },
        { status: 400 }
      );
    }

    // Check if it's development or production environment
    // For now, disable email confirmation in all environments to test
    const requireEmailConfirmation = false;

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          birthYear: parseInt(birthYear),
        },
        emailRedirectTo: requireEmailConfirmation
          ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/auth/confirm`
          : undefined,
      },
    });

    if (error) {
      console.error("[Registration] Supabase error:", error);
      if (error.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "This email is already registered. Please sign in." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "Registration failed",
          details: error.message || "Unable to create account. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    // Create user data object
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: name,
      birthYear: parseInt(birthYear),
      storyCount: 0,
      isPaid: false,
    };

    // If email confirmation is required, return a special response
    if (requireEmailConfirmation && !data.session) {
      return NextResponse.json({
        user: userData,
        requiresEmailConfirmation: true,
        message: "Please check your email to confirm your account",
      });
    }

    // Otherwise return user with session
    return NextResponse.json({
      user: userData,
      session: data.session,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}