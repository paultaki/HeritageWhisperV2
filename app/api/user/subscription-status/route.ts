import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/user/subscription-status
 *
 * Returns the current user's subscription status and details
 *
 * Returns: {
 *   isPaid: boolean
 *   subscriptionStatus: string
 *   planType: string | null
 *   currentPeriodEnd: string | null (ISO date)
 *   cancelAtPeriodEnd: boolean
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication (ALWAYS FIRST)
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.error("Auth error in subscription-status:", authError);
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2. Get user's subscription status from users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("is_paid, subscription_status")
      .eq("id", userId)
      .single();

    if (profileError) {
      logger.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch subscription status" },
        { status: 500 }
      );
    }

    // 3. Get detailed subscription info from stripe_customers table
    const { data: stripeData } = await supabaseAdmin
      .from("stripe_customers")
      .select(
        "plan_type, current_period_end, cancel_at_period_end, status"
      )
      .eq("user_id", userId)
      .single();

    // 4. Return subscription status (transform to camelCase)
    return NextResponse.json({
      isPaid: userProfile.is_paid || false,
      subscriptionStatus: userProfile.subscription_status || "none",
      planType: stripeData?.plan_type || null,
      currentPeriodEnd: stripeData?.current_period_end || null,
      cancelAtPeriodEnd: stripeData?.cancel_at_period_end || false,
      stripeStatus: stripeData?.status || null,
    });
  } catch (error: any) {
    logger.error("Error in GET /api/user/subscription-status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
