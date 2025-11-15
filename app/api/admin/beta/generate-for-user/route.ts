import { NextRequest, NextResponse } from "next/server";
import { generateCode } from "@/lib/betaCodes";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, count, expiresAt } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Validate count
    if (!count || typeof count !== "number" || count < 1 || count > 20) {
      return NextResponse.json(
        { error: "Count must be between 1 and 20" },
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

    // Look up user by email
    const { data: users, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = users[0].id;

    // Generate codes
    const codes = Array.from({ length: count }, () => generateCode());

    // Insert codes
    const codesToInsert = codes.map(code => ({
      code,
      issued_to_user_id: userId,
      expires_at: expiresAt || null,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("beta_codes")
      .insert(codesToInsert);

    if (insertError) {
      throw insertError;
    }

    logger.debug(`[Admin Beta] Generated ${codes.length} codes for user ${email}`);

    return NextResponse.json({
      codes,
      message: `Successfully generated ${codes.length} codes for ${email}`,
    });
  } catch (error) {
    logger.error("[Admin Beta] Error generating codes for user:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Failed to generate codes for user" },
      { status: 500 }
    );
  }
}
