import { NextRequest, NextResponse } from "next/server";
import { validatePrintToken } from "@/lib/printToken";

export const runtime = "nodejs";

/**
 * Validate a print token and return the associated userId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const userId = validatePrintToken(token);

    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return NextResponse.json({ userId });
  } catch (error) {
    console.error("[Print Token] Validation error:", error);
    return NextResponse.json(
      { error: "Token validation failed" },
      { status: 500 }
    );
  }
}
