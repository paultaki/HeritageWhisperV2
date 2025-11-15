import { NextRequest, NextResponse } from "next/server";
import { revokeBetaCode } from "@/lib/betaCodes";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codeId } = body;

    if (!codeId) {
      return NextResponse.json(
        { error: "Code ID is required" },
        { status: 400 }
      );
    }

    await revokeBetaCode(codeId);

    logger.debug(`[Admin Beta] Revoked code ${codeId}`);

    return NextResponse.json({
      message: "Code revoked successfully",
    });
  } catch (error) {
    logger.error("[Admin Beta] Error revoking code:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Failed to revoke code" },
      { status: 500 }
    );
  }
}
