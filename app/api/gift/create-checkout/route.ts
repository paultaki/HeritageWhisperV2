import { NextRequest, NextResponse } from "next/server";
import { stripe, GIFT_PRICE_ID } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Request validation schema
 */
const createGiftCheckoutSchema = z.object({
  purchaserEmail: z.string().email("Valid email required"),
  purchaserName: z.string().min(1, "Name is required").optional(),
});

/**
 * POST /api/gift/create-checkout
 *
 * Creates a Stripe Checkout session for a gift subscription purchase.
 * This is a guest checkout - no authentication required.
 *
 * Body: {
 *   purchaserEmail: string (required)
 *   purchaserName: string (optional)
 * }
 *
 * Returns: {
 *   url: string (Stripe Checkout URL to redirect to)
 *   sessionId: string (Stripe session ID)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate GIFT_PRICE_ID is configured
    if (!GIFT_PRICE_ID) {
      logger.error("STRIPE_GIFT_PRICE_ID not configured");
      return NextResponse.json(
        { error: "Gift purchase is not available at this time" },
        { status: 503 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();

    const validation = createGiftCheckoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { purchaserEmail, purchaserName } = validation.data;

    // 3. Create Stripe Checkout Session (one-time payment, guest mode)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment", // One-time payment, NOT subscription
      customer_creation: "always", // Create Stripe customer even for guests
      customer_email: purchaserEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price: GIFT_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/gift?canceled=true`,
      metadata: {
        purchase_type: "gift",
        purchaser_email: purchaserEmail,
        purchaser_name: purchaserName || "",
      },
      payment_intent_data: {
        metadata: {
          purchase_type: "gift",
          purchaser_email: purchaserEmail,
        },
      },
      // Custom display for checkout
      custom_text: {
        submit: {
          message: "Your gift code will be shown immediately after payment.",
        },
      },
    });

    logger.info(`Gift checkout session created: ${session.id} for ${purchaserEmail}`);

    // 4. Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    logger.error("Error creating gift checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
