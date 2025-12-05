import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/stripe/customer-portal
 *
 * Creates a Stripe Customer Portal session for subscription management
 *
 * Allows premium users to:
 * - Cancel subscription
 * - Update payment method
 * - View billing history
 * - Download invoices
 *
 * Returns: {
 *   url: string (Stripe Customer Portal URL to redirect to)
 * }
 */
export async function POST(request: NextRequest) {
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
      logger.error("Auth error in customer-portal:", authError);
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // FIX: Extract userId from authenticated user
    const userId = user.id;

    // 2. Check if user is a premium member
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("is_paid, email")
      .eq("id", userId)
      .single();

    if (!profile?.is_paid) {
      logger.warn(`Non-premium user ${userId} attempted to access portal`);
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 }
      );
    }

    // 3. Get Stripe customer ID from stripe_customers table
    const { data: stripeCustomer } = await supabaseAdmin
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let stripeCustomerId: string;

    if (!stripeCustomer?.stripe_customer_id) {
      // Fallback: search for customer by email in Stripe
      const customers = await stripe.customers.list({
        email: profile.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        logger.error(
          `Stripe customer not found for premium user ${userId} (${profile.email})`
        );
        return NextResponse.json(
          { error: "Stripe customer not found" },
          { status: 404 }
        );
      }

      // Update database with found customer ID
      await supabaseAdmin.from("stripe_customers").upsert(
        {
          user_id: userId,
          stripe_customer_id: customers.data[0].id,
        },
        {
          onConflict: "user_id",
        }
      );

      stripeCustomerId = customers.data[0].id;
      logger.info(
        `Synced Stripe customer ${stripeCustomerId} for user ${userId}`
      );
    } else {
      stripeCustomerId = stripeCustomer.stripe_customer_id;
    }

    // 4. Create Customer Portal session
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/profile?portal_return=true`,
    });

    logger.info(`Customer portal session created for user ${userId}`);

    // 5. Return portal URL
    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
    logger.error("Error creating customer portal session:", error);
    return NextResponse.json(
      {
        error: "Failed to create customer portal session",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
