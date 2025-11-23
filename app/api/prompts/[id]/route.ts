import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";
// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
      const authHeader = request.headers.get("authorization");
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Verify the JWT token with Supabase
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }
      userId = user.id;
    }

    const promptId = params.id;

    if (!promptId) {
      return NextResponse.json(
        { error: "Prompt ID is required" },
        { status: 400 }
      );
    }

    // Try to delete from active_prompts first (AI prompts)
    const { data: aiData, error: aiError } = await supabaseAdmin
      .from("active_prompts")
      .delete()
      .eq("id", promptId)
      .eq("user_id", userId)
      .select();

    // If found in active_prompts, return success
    if (!aiError && aiData && aiData.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Prompt permanently deleted",
      });
    }

    // If not found in active_prompts, try user_prompts (catalog prompts)
    const { data: catalogData, error: catalogError } = await supabaseAdmin
      .from("user_prompts")
      .delete()
      .eq("id", promptId)
      .eq("user_id", userId)
      .select();

    // If found in user_prompts, return success
    if (!catalogError && catalogData && catalogData.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Prompt permanently deleted",
      });
    }

    // If not found in either table, log and return error
    logger.error("Prompt not found in either table:", { promptId, aiError, catalogError });
    return NextResponse.json(
      { error: "Prompt not found or already deleted" },
      { status: 404 }
    );
  } catch (err) {
    logger.error("Error in DELETE /api/prompts/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
