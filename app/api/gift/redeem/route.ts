import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { redeemGiftCode, normalizeGiftCode } from "@/lib/giftCodes";
import { logger } from "@/lib/logger";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Request validation schema
 */
const redeemGiftCodeSchema = z.object({
  code: z.string().min(1, "Gift code is required"),
});

/**
 * POST /api/gift/redeem
 *
 * Redeems a gift code for the authenticated user.
 * Requires authentication.
 *
 * Body: {
 *   code: string (the gift code to redeem)
 * }
 *
 * Returns: {
 *   success: boolean
 *   error?: string (if failed)
 *   isExtension: boolean (true if extending existing subscription)
 *   newExpirationDate: string (ISO date)
 *   message: string (user-friendly message)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication (ALWAYS FIRST)
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.error("Auth error in gift redeem:", authError);
      return NextResponse.json(
        { success: false, error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // 2. Get user profile for email and name
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("email, name")
      .eq("id", user.id)
      .single();

    if (!profile?.email) {
      logger.error(`User profile not found for user ${user.id}`);
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();

    const validation = redeemGiftCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const normalizedCode = normalizeGiftCode(code);

    // 4. Redeem the gift code
    const result = await redeemGiftCode(
      normalizedCode,
      user.id,
      profile.email,
      profile.name || undefined
    );

    if (!result.success) {
      logger.warn(`Gift code redemption failed for user ${user.id}: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error,
      });
    }

    // 5. Build user-friendly message
    const expirationFormatted = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(result.newExpirationDate);

    let message: string;
    if (result.isExtension) {
      message = `Your subscription has been extended! You now have Premium access until ${expirationFormatted}.`;
    } else {
      message = `Welcome to HeritageWhisper Premium! Your subscription is active until ${expirationFormatted}.`;
    }

    logger.info(
      `Gift code redeemed successfully: user ${user.id}, code ${normalizedCode}, isExtension: ${result.isExtension}`
    );

    // 6. Return success
    return NextResponse.json({
      success: true,
      isExtension: result.isExtension,
      newExpirationDate: result.newExpirationDate.toISOString(),
      message,
    });
  } catch (error: any) {
    logger.error("Error redeeming gift code:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to redeem gift code",
      },
      { status: 500 }
    );
  }
}
