import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { generateTier1Prompts, validatePromptQuality } from "@/lib/promptGeneration";
import { hasAIConsent } from "@/lib/aiConsent";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Config
const TIER1_TTL_DAYS = 7;

// Helpers
function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}
function wc(s: string) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

// Decade fallback prompts (kept from your version)
function generateDecadeFallback(
  birthYear: number,
  recordedDecades: Set<number>
): {
  prompt_text: string;
  context_note: string;
  anchor_entity: string;
  tier: number;
} {
  const currentYear = new Date().getFullYear();
  const livedDecades: number[] = [];
  for (let year = birthYear; year <= currentYear; year += 10) {
    const decade = Math.floor(year / 10) * 10;
    if (!livedDecades.includes(decade)) livedDecades.push(decade);
  }
  const unrecordedDecades = livedDecades.filter((d) => !recordedDecades.has(d));
  const decade =
    unrecordedDecades.length > 0
      ? unrecordedDecades[Math.floor(Math.random() * unrecordedDecades.length)]
      : livedDecades[Math.floor(Math.random() * livedDecades.length)];

  const prompts = [
    `Think back to the ${decade}s. What decision from then still echoes today?`,
    `In the ${decade}s, who shaped you the most, and how?`,
    `What felt hard in the ${decade}s that later made sense?`,
    `What did you gain in the ${decade}s, and what did it cost?`,
    `What promise you made in the ${decade}s still matters now?`,
  ];

  return {
    prompt_text: prompts[Math.floor(Math.random() * prompts.length)],
    context_note: `A memory from the ${decade}s`,
    anchor_entity: `${decade}s`,
    tier: 0,
  };
}

// Try to fetch user's last story + extracted signals
async function fetchLastStoryBundle(userId: string) {
  // Pull the most recent story
  const { data: story, error: storyErr } = await supabaseAdmin
    .from("stories")
    .select(
      `
      id,
      story_text,
      story_year,
      emotions,
      entities,
      extracted_entities,
      ner
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (storyErr || !story) return null;

  // Normalize entities/emotions from whatever columns you have
  // Accepts: entities | extracted_entities | ner
  let rawEntities: any[] =
    story.entities || story.extracted_entities || story.ner || [];
  if (!Array.isArray(rawEntities)) rawEntities = [];

  // Best-effort mapping to our generator shape
  const entities = rawEntities
    .map((e: any) => {
      // Support several common shapes
      // { kind, text } or { type, text } or { label, value }
      const text = e?.text ?? e?.value ?? e?.name ?? e?.surface ?? "";
      const kindRaw = (e?.kind ?? e?.type ?? e?.label ?? "").toString().toLowerCase();
      let kind: "person" | "place" | "object" | "emotion" = "object";
      if (kindRaw.includes("person") || kindRaw === "per" || kindRaw === "human") kind = "person";
      else if (kindRaw.includes("place") || kindRaw === "loc") kind = "place";
      else if (kindRaw.includes("emotion") || kindRaw === "emo") kind = "emotion";
      return text ? { kind, text } : null;
    })
    .filter((item): item is { kind: "person" | "place" | "object" | "emotion"; text: string } => item !== null);

  const emotions: string[] = Array.isArray(story.emotions)
    ? story.emotions.filter(Boolean)
    : [];

  return {
    storyId: story.id,
    text: story.story_text ?? "",
    yearHint: story.story_year ?? null,
    entities,
    emotions,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Auth: same as your code
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    // Check AI consent - return empty if disabled
    const aiEnabled = await hasAIConsent(user.id);
    if (!aiEnabled) {
      logger.debug("[Prompts Next] AI processing disabled for user, returning no prompts");
      return NextResponse.json({ prompt: null });
    }

    // 1) Existing unlocked prompts, ordered by tier desc then prompt_score desc — but quality gated
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from("active_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_locked", false)
      .gt("expires_at", new Date().toISOString())
      .order("tier", { ascending: false })
      .order("prompt_score", { ascending: false })
      .limit(10);

    if (promptsError) {
      logger.error("Error fetching active prompts:", promptsError);
      return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
    }

    const validExisting = (prompts ?? []).filter(
      (p) => validatePromptQuality(p.prompt_text) && wc(p.prompt_text) <= 30
    );

    if (validExisting.length > 0) {
      // Keep your precedence: highest tier, highest score
      const best = validExisting[0];
      return NextResponse.json({ prompt: best });
    }

    // 2) No valid existing → try Tier-1 generation from the most recent story
    const bundle = await fetchLastStoryBundle(user.id);

    if (bundle) {
      const t1 = generateTier1Prompts({
        userId: user.id,
        storyId: bundle.storyId,
        text: bundle.text,
        entities: bundle.entities,
        yearHint: bundle.yearHint,
        emotions: bundle.emotions,
      });

      // Take the top validated
      const top = t1.find((p) => validatePromptQuality(p.prompt_text) && wc(p.prompt_text) <= 30);

      if (top) {
        // Insert into active_prompts so your app sees it everywhere
        const insertPayload: any = {
          user_id: user.id,
          prompt_text: top.prompt_text,
          type: top.type,                 // if you have a type column
          tier: 1,                        // Tier-1
          is_locked: false,
          prompt_score: 80,               // seed a sane score; your scorer can update later
          source_story_id: top.source_story_id ?? bundle.storyId,
          expires_at: addDays(new Date(), TIER1_TTL_DAYS).toISOString(),
          shown_count: 0,
          created_at: new Date().toISOString(),
        };

        const { data: ins, error: insErr } = await supabaseAdmin
          .from("active_prompts")
          .insert(insertPayload)
          .select("*")
          .single();

        if (insErr) {
          logger.warn("Tier-1 insert failed, returning ephemeral:", insErr);
          // Return ephemeral if DB insert fails
          return NextResponse.json({
            prompt: {
              ...insertPayload,
              id: null,
              expires_at: null,
            },
          });
        }

        return NextResponse.json({ prompt: ins });
      }
    }

    // 3) Final fallback — decade prompt (≤30 words, no robotic phrasing)
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("birth_year")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.birth_year) {
      return NextResponse.json({ prompt: null });
    }

    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("story_year")
      .eq("user_id", user.id)
      .not("story_year", "is", null);

    if (storiesError) {
      logger.error("Error fetching stories for fallback:", storiesError);
    }

    const recordedDecades = new Set<number>();
    (stories ?? []).forEach((s: any) => {
      if (s.story_year) recordedDecades.add(Math.floor(s.story_year / 10) * 10);
    });

    const fallbackPrompt = generateDecadeFallback(userData.birth_year, recordedDecades);

    return NextResponse.json({
      prompt: {
        ...fallbackPrompt,
        id: null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        expires_at: null,
        shown_count: 0,
      },
    });
  } catch (err) {
    logger.error("Error in GET /api/prompts/next:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
