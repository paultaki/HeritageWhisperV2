import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, users } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * POST /api/user/passkey-preference
 *
 * Update user's passkey prompt preference
 * Body: { preference: 'later' | 'never' }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn("[passkey-preference] Auth failed:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { preference } = body;

    // Validate preference value
    if (!preference || !["later", "never"].includes(preference)) {
      return NextResponse.json(
        { error: "Invalid preference. Must be 'later' or 'never'" },
        { status: 400 }
      );
    }

    // Update user preference in database
    await db
      .update(users)
      .set({
        passkeyPromptDismissed: preference,
        lastPasskeyPromptAt: sql`NOW()`,
      })
      .where(eq(users.id, user.id));

    logger.info(`[passkey-preference] User ${user.id} set preference: ${preference}`);

    return NextResponse.json({
      success: true,
      preference,
    });
  } catch (error) {
    logger.error(
      "[passkey-preference] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to update preference" },
      { status: 500 }
    );
  }
}
