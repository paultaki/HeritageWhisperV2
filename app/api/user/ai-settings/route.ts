import { NextRequest, NextResponse } from "next/server";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/user/ai-settings
 * Returns the current AI processing consent status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseAdmin;

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get AI processing preference
    const { data, error } = await supabase
      .from("users")
      .select("ai_processing_enabled")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[AI Settings GET] Error:", error);
      return NextResponse.json(
        { error: "Failed to get AI settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ai_processing_enabled: data?.ai_processing_enabled ?? true,
    });
  } catch (error) {
    console.error("[AI Settings GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/ai-settings
 * Updates the AI processing consent status for the authenticated user
 *
 * Body: { ai_processing_enabled: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseAdmin;

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { ai_processing_enabled } = body;

    if (typeof ai_processing_enabled !== "boolean") {
      return NextResponse.json(
        { error: "ai_processing_enabled must be a boolean" },
        { status: 400 }
      );
    }

    // Update AI processing preference
    const { error: updateError } = await supabase
      .from("users")
      .update({
        ai_processing_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[AI Settings PUT] Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update AI settings" },
        { status: 500 }
      );
    }

    console.log(
      `[AI Settings] User ${user.id} ${ai_processing_enabled ? "enabled" : "disabled"} AI processing`
    );

    return NextResponse.json({
      success: true,
      ai_processing_enabled,
    });
  } catch (error) {
    console.error("[AI Settings PUT] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
