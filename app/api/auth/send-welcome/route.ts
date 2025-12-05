import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/resend";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's name from metadata or database
    const userName =
      user.user_metadata?.name || user.email?.split("@")[0] || "there";

    // Send welcome email
    const result = await sendWelcomeEmail(user.email!, userName);

    if (!result.success) {
      logger.error("[Welcome Email] Failed to send:", result.error);
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Welcome email sent",
    });
  } catch (error) {
    logger.error("[Welcome Email] Error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 },
    );
  }
}
