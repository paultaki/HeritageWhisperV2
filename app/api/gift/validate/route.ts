import { NextRequest, NextResponse } from "next/server";
import { validateGiftCode, normalizeGiftCode } from "@/lib/giftCodes";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Request validation schema
 */
const validateGiftCodeSchema = z.object({
  code: z.string().min(1, "Gift code is required"),
});

/**
 * POST /api/gift/validate
 *
 * Validates a gift code without redeeming it.
 * No authentication required - anyone can check if a code is valid.
 *
 * Body: {
 *   code: string (the gift code to validate)
 * }
 *
 * Returns: {
 *   valid: boolean
 *   error?: string (if not valid)
 *   giftDetails?: {
 *     purchaserName: string | null
 *     expiresAt: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();

    const validation = validateGiftCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { valid: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const normalizedCode = normalizeGiftCode(code);

    // 2. Validate the gift code
    const result = await validateGiftCode(normalizedCode);

    if (!result.valid) {
      logger.info(`Gift code validation failed: ${normalizedCode} - ${result.error}`);
      return NextResponse.json({
        valid: false,
        error: result.error,
      });
    }

    // 3. Return success with limited gift details
    // Don't expose sensitive info - just what recipient needs to see
    const giftCode = result.giftCode!;

    return NextResponse.json({
      valid: true,
      giftDetails: {
        purchaserName: giftCode.purchaserName,
        expiresAt: giftCode.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error("Error validating gift code:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate gift code",
      },
      { status: 500 }
    );
  }
}
