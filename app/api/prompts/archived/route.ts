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

interface ArchivedPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'ai' | 'catalog';
  category?: string;
  tier?: number;
  dismissed_at: string;
  anchor_entity?: string;
  anchor_year?: number;
}

export async function GET(request: NextRequest) {
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

    // Fetch dismissed AI-generated prompts from active_prompts
    const { data: aiPrompts, error: aiError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", userId)
      .eq("user_status", "dismissed")
      .order("dismissed_at", { ascending: false });

    if (aiError) {
      logger.error("Error fetching dismissed AI prompts:", aiError);
    }

    // Fetch dismissed catalog prompts from user_prompts
    const { data: catalogPrompts, error: catalogError } = await supabaseAdmin
      .from("user_prompts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "dismissed")
      .order("dismissed_at", { ascending: false });

    if (catalogError) {
      logger.error("Error fetching dismissed catalog prompts:", catalogError);
    }

    // Transform AI prompts to unified format
    const transformedAiPrompts: ArchivedPrompt[] = (aiPrompts || []).map(p => ({
      id: p.id,
      prompt_text: p.prompt_text,
      context_note: p.context_note,
      source: 'ai' as const,
      tier: p.tier,
      dismissed_at: p.dismissed_at || p.created_at,
      anchor_entity: p.anchor_entity,
      anchor_year: p.anchor_year,
    }));

    // Transform catalog prompts to unified format
    const transformedCatalogPrompts: ArchivedPrompt[] = (catalogPrompts || []).map(p => ({
      id: p.id,
      prompt_text: p.text,
      context_note: null,
      source: 'catalog' as const,
      category: p.category,
      dismissed_at: p.dismissed_at || p.created_at,
    }));

    // Combine and sort by dismissed_at (most recent first)
    const allPrompts = [...transformedAiPrompts, ...transformedCatalogPrompts].sort((a, b) => {
      return new Date(b.dismissed_at).getTime() - new Date(a.dismissed_at).getTime();
    });

    return NextResponse.json({ prompts: allPrompts });

  } catch (err) {
    logger.error("Error in GET /api/prompts/archived:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
