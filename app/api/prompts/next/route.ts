import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Decade fallback prompts when no active prompts exist
function generateDecadeFallback(birthYear: number, recordedDecades: Set<number>): {
  prompt_text: string;
  context_note: string;
  anchor_entity: string;
  tier: number;
} {
  const currentYear = new Date().getFullYear();
  const livedDecades: number[] = [];
  
  // Calculate decades user has lived through
  for (let year = birthYear; year <= currentYear; year += 10) {
    const decade = Math.floor(year / 10) * 10;
    if (!livedDecades.includes(decade)) {
      livedDecades.push(decade);
    }
  }
  
  // Find unrecorded decades
  const unrecordedDecades = livedDecades.filter(d => !recordedDecades.has(d));
  
  // Pick random decade (prefer unrecorded, fallback to any)
  const decade = unrecordedDecades.length > 0 
    ? unrecordedDecades[Math.floor(Math.random() * unrecordedDecades.length)]
    : livedDecades[Math.floor(Math.random() * livedDecades.length)];
  
  // Random decade-based prompt
  const prompts = [
    `Tell me about a typical Saturday in the ${decade}s.`,
    `What was your favorite thing about the ${decade}s?`,
    `What do you remember most about ${decade}?`,
    `Tell me a story from the ${decade}s that makes you smile.`,
    `What was happening in your life in ${decade}?`,
  ];
  
  return {
    prompt_text: prompts[Math.floor(Math.random() * prompts.length)],
    context_note: `A memory from the ${decade}s`,
    anchor_entity: `${decade}s`,
    tier: 0, // Fallback tier
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Fetch next active prompt for this user
    // ORDER BY tier DESC (Tier 3 > Tier 2 > Tier 1), then by prompt_score DESC
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_locked", false)
      .gt("expires_at", new Date().toISOString())
      .order("tier", { ascending: false })
      .order("prompt_score", { ascending: false })
      .limit(1);

    if (promptsError) {
      logger.error("Error fetching active prompts:", promptsError);
      return NextResponse.json(
        { error: "Failed to fetch prompts" },
        { status: 500 },
      );
    }

    // If we have an active prompt, return it
    if (prompts && prompts.length > 0) {
      return NextResponse.json({ prompt: prompts[0] });
    }

    // No active prompts - check if we can generate Tier 2 on-demand
    // TODO: Implement Tier 2 on-demand generation in future update
    // For now, return decade fallback

    // Get user's birth year and recorded story decades
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("birth_year")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.birth_year) {
      // Can't generate fallback without birth year, return null
      return NextResponse.json({ prompt: null });
    }

    // Get decades user has already recorded stories in
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("story_year")
      .eq("user_id", user.id)
      .not("story_year", "is", null);

    const recordedDecades = new Set<number>();
    if (stories) {
      stories.forEach(s => {
        if (s.story_year) {
          recordedDecades.add(Math.floor(s.story_year / 10) * 10);
        }
      });
    }

    // Generate and return decade fallback
    const fallbackPrompt = generateDecadeFallback(userData.birth_year, recordedDecades);
    
    return NextResponse.json({ 
      prompt: {
        ...fallbackPrompt,
        id: null, // Null ID indicates this is a fallback, not stored in DB
        user_id: user.id,
        created_at: new Date().toISOString(),
        expires_at: null,
        shown_count: 0,
      }
    });

  } catch (err) {
    logger.error("Error in GET /api/prompts/next:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
