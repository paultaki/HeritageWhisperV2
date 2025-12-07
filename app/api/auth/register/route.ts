import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userAgreements, users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { authRatelimit, getClientIp, checkRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { RegisterUserSchema, safeValidateRequestBody } from "@/lib/validationSchemas";
import { validateBetaCode, markBetaCodeUsed, createInviteCodesForUser } from "@/lib/betaCodes";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

type MaybePromise<T> = T | Promise<T>;

// Current versions of legal documents
const CURRENT_TERMS_VERSION = "1.0";
const CURRENT_PRIVACY_VERSION = "1.0";

export async function POST(request: NextRequest) {
  // Rate limiting: 5 attempts per 10 seconds per IP
  const clientIp = getClientIp(request);
  const rateLimitResponse = await checkRateLimit(
    `register:${clientIp}`,
    authRatelimit,
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Parse and validate request body
    const rawBody = await request.json();

    // Validate input with Zod schema
    const validationResult = safeValidateRequestBody(RegisterUserSchema, rawBody);

    if (!validationResult.success) {
      // Format validation errors for user-friendly response
      const errorMessages = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      logger.warn('[Registration] Validation failed:', errorMessages);

      return NextResponse.json(
        {
          error: 'Invalid registration data',
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    // Use validated data
    const { email, password, name, birthYear } = validationResult.data;
    const betaCode = rawBody.betaCode as string | undefined;

    // Check if beta code is required
    const requireBetaCode = process.env.NEXT_PUBLIC_REQUIRE_BETA_CODE === "true";
    let validatedBetaCode: any = null;

    if (requireBetaCode) {
      if (!betaCode) {
        return NextResponse.json(
          { error: "Beta access code is required" },
          { status: 400 }
        );
      }

      try {
        validatedBetaCode = await validateBetaCode(betaCode);
      } catch (error) {
        logger.warn("[Registration] Beta code validation failed:", error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid beta code" },
          { status: 400 }
        );
      }
    }

    // Require email confirmation for all new users
    const requireEmailConfirmation = true;

    // Create user in Supabase Auth - they will need to confirm their email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          birthYear: parseInt(String(birthYear ?? "")),
        },
        // Force redirect to callback page after email confirmation
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://heritagewhisper.com"}/auth/callback`,
      },
    });

    if (error) {
      // Log error message only, not full error object that may contain PII
      logger.error("[Registration] Supabase error:", error.message);

      // Handle email already registered
      if (error.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "This email is already registered. Please sign in." },
          { status: 400 },
        );
      }

      // Intercept password policy errors - show friendly message instead of raw Supabase error
      const isPasswordPolicyError =
        error.message?.toLowerCase().includes("password") &&
        (error.message?.includes("should contain") ||
          error.message?.includes("must contain") ||
          error.message?.includes("too short") ||
          error.message?.includes("too weak"));

      if (isPasswordPolicyError) {
        // Log for monitoring - indicates possible client/server validation mismatch
        logger.warn(
          "[Registration] Password policy mismatch - client validation may need updating"
        );
        return NextResponse.json(
          {
            error: "Password requirements not met",
            details:
              "Please check that your password meets all the requirements shown.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: "Registration failed",
          details:
            error.message || "Unable to create account. Please try again.",
        },
        { status: 500 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 },
      );
    }

    // Get IP address and user agent for audit trail
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create user record in public.users and record agreements using Supabase client
    try {
      // First, create the user record in public.users table
      const { error: userInsertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email!,
        name: name,
        birth_year: parseInt(String(birthYear ?? "")),
        story_count: 0,
        is_paid: false,
        latest_terms_version: CURRENT_TERMS_VERSION,
        latest_privacy_version: CURRENT_PRIVACY_VERSION,
      });

      if (userInsertError) {
        logger.error("[Registration] Error creating user:", userInsertError.message);

        // If we failed to insert into public.users, we need to abort
        // The auth.users entry was created but we can't complete registration
        if (userInsertError.message?.includes("duplicate key") ||
            userInsertError.message?.includes("unique constraint")) {
          // Try to clean up the orphaned auth.users entry
          try {
            await supabase.auth.admin.deleteUser(data.user.id);
            logger.debug("[Registration] Cleaned up orphaned auth user after duplicate email");
          } catch (cleanupError) {
            logger.error("[Registration] Failed to cleanup orphaned auth user:",
              cleanupError instanceof Error ? cleanupError.message : 'Unknown error');
          }

          return NextResponse.json(
            { error: "This email is already registered. Please sign in or reset your password." },
            { status: 400 }
          );
        }

        // For other insert errors, also abort to prevent cascading failures
        return NextResponse.json(
          { error: "Registration failed. Please try again." },
          { status: 500 }
        );
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
        logger.error(
          "[Registration] Error recording agreements:",
          agreementsError.message,
        );
      } else {
        logger.debug(
          `[Registration] Created user record and recorded agreement acceptance for user ${data.user.id}`,
        );
      }

      // Mark beta code as used if one was validated
      if (validatedBetaCode) {
        try {
          await markBetaCodeUsed(validatedBetaCode.id, data.user.id);
          logger.debug(`[Registration] Marked beta code as used for user ${data.user.id}`);
        } catch (betaCodeError) {
          logger.error(
            "[Registration] Failed to mark beta code as used:",
            betaCodeError instanceof Error ? betaCodeError.message : 'Unknown error',
          );
        }
      }

      // Create invite codes for the new user
      try {
        const inviteCodes = await createInviteCodesForUser(data.user.id, 5);
        logger.debug(
          `[Registration] Created ${inviteCodes.length} invite codes for user ${data.user.id}`,
        );
      } catch (inviteError) {
        logger.error(
          "[Registration] Failed to create invite codes:",
          inviteError instanceof Error ? inviteError.message : 'Unknown error',
        );
        // Don't fail registration if invite code creation fails
      }
    } catch (agreementError) {
      logger.error(
        "[Registration] Failed to create user or record agreement acceptance:",
        agreementError instanceof Error ? agreementError.message : 'Unknown error',
      );
      // Don't fail registration if agreement recording fails, but log it
    }

    // Only auto-sign-in if email confirmation is NOT required
    let session = data.session;
    if (!session && !requireEmailConfirmation) {
      logger.debug("[Registration] No session from signUp, signing in user...");
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        logger.error(
          "[Registration] Sign in after registration failed:",
          signInError.message,
        );
      } else {
        session = signInData.session;
        logger.debug(
          "[Registration] Successfully signed in after registration",
        );
      }
    }

    // If email confirmation is required and a session was created, clear it
    // (This happens when Supabase has email confirmation disabled in settings)
    if (requireEmailConfirmation && session) {
      logger.debug(
        "[Registration] Email confirmation required but session exists - clearing session",
      );
      session = null;
    }

    // Create user data object
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: name,
      birthYear: parseInt(String(birthYear ?? "")),
      storyCount: 0,
      isPaid: false,
    };

    // If email confirmation is required, Supabase will send the verification email
    // (configured in supabase.auth.signUp with emailRedirectTo option above)
    if (requireEmailConfirmation && !session) {
      // NOTE: We're NOT sending a custom Resend email here because Supabase
      // already sent its native confirmation email to /auth/callback
      // The custom Resend email was causing conflicts - it went to /auth/verified
      // which doesn't actually confirm the email in Supabase's system

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
    // Log error without exposing PII or credentials
    logger.error("Registration error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
