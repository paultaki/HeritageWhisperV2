import { NextRequest, NextResponse } from "next/server";
import { getGiftCodeBySessionId } from "@/lib/giftCodes";
import { logger } from "@/lib/logger";

/**
 * GET /api/gift/session/[sessionId]
 *
 * Retrieves gift code details by Stripe checkout session ID.
 * Used on the success page to display the code after purchase.
 * No authentication required - session ID acts as proof of purchase.
 *
 * Returns: {
 *   code: string
 *   expiresAt: string
 *   purchaserName: string | null
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get the gift code by session ID
    const giftCode = await getGiftCodeBySessionId(sessionId);

    if (!giftCode) {
      return NextResponse.json(
        { error: "Gift code not found for this session" },
        { status: 404 }
      );
    }

    // Return only the necessary fields
    return NextResponse.json({
      code: giftCode.code,
      expiresAt: giftCode.expiresAt,
      purchaserName: giftCode.purchaserName,
    });
  } catch (error: any) {
    logger.error("Error fetching gift code by session:", error);
    return NextResponse.json(
      { error: "Failed to retrieve gift code" },
      { status: 500 }
    );
  }
}
