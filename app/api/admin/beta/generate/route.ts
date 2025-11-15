import { NextRequest, NextResponse } from "next/server";
import { createGenericBetaCodes } from "@/lib/betaCodes";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count, expiresAt } = body;

    // Validate count
    if (!count || typeof count !== "number" || count < 1 || count > 100) {
      return NextResponse.json(
        { error: "Count must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate expiry date if provided
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiry date" },
          { status: 400 }
        );
      }
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: "Expiry date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Generate codes
    const codes = await createGenericBetaCodes(count, expiresAt);

    logger.debug(`[Admin Beta] Generated ${codes.length} generic codes`);

    return NextResponse.json({
      codes,
      message: `Successfully generated ${codes.length} beta codes`,
    });
  } catch (error) {
    logger.error("[Admin Beta] Error generating codes:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Failed to generate codes" },
      { status: 500 }
    );
  }
}
