import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { userAgreements, users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/resend";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Current versions of legal documents
const CURRENT_TERMS_VERSION = "1.0";
const CURRENT_PRIVACY_VERSION = "1.0";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, birthYear } = await request.json();

    if (!email || !password || !name || !birthYear) {
      return NextResponse.json(
        { error: "Email, password, name, and birth year are required" },
        { status: 400 }
      );
    }

    // Disable email confirmation - auto-confirm all users for better UX
    // Email verification can be added later if needed
    const requireEmailConfirmation = false;

    // Create user in Supabase Auth with auto-confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          birthYear: parseInt(birthYear),
        },
        emailRedirectTo: undefined, // Not needed with auto-confirm
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

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") ||
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create user record in public.users and record agreements using Supabase client
    try {
      // First, create the user record in public.users table
      const { error: userInsertError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name: name,
          birth_year: parseInt(birthYear),
          story_count: 0,
          is_paid: false,
          latest_terms_version: CURRENT_TERMS_VERSION,
          latest_privacy_version: CURRENT_PRIVACY_VERSION,
        });

      if (userInsertError) {
        console.error("[Registration] Error creating user:", userInsertError);
        // Don't fail registration - user exists in auth.users
      }

      // Then record both agreements in parallel
      const { error: agreementsError } = await supabase
        .from("user_agreements")
        .insert([
          {
            user_id: data.user.id,
            agreement_type: "terms",
            version: CURRENT_TERMS_VERSION,
            ip_address: ipAddress,
            user_agent: userAgent,
            method: "signup",
          },
          {
            user_id: data.user.id,
            agreement_type: "privacy",
            version: CURRENT_PRIVACY_VERSION,
            ip_address: ipAddress,
            user_agent: userAgent,
            method: "signup",
          },
        ]);

      if (agreementsError) {
        console.error("[Registration] Error recording agreements:", agreementsError);
      } else {
        console.log(`[Registration] Created user record and recorded agreement acceptance for user ${data.user.id}`);
      }
    } catch (agreementError) {
      console.error("[Registration] Failed to create user or record agreement acceptance:", agreementError);
      // Don't fail registration if agreement recording fails, but log it
    }

    // If no session was created (email confirmation disabled), sign in the user
    let session = data.session;
    if (!session && !requireEmailConfirmation) {
      console.log('[Registration] No session from signUp, signing in user...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[Registration] Sign in after registration failed:', signInError);
      } else {
        session = signInData.session;
        console.log('[Registration] Successfully signed in after registration');
      }
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

    // If email confirmation is required, send verification email via Resend
    if (requireEmailConfirmation && !session) {
      const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/verified?email=${encodeURIComponent(email)}`;

      await sendVerificationEmail(email, name, confirmationUrl);

      return NextResponse.json({
        user: userData,
        requiresEmailConfirmation: true,
        message: "Please check your email to confirm your account",
      });
    }

    // Otherwise return user with session
    return NextResponse.json({
      user: userData,
      session: session,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}