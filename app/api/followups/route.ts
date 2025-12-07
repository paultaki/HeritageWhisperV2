import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { apiRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { getPasskeySession } from "@/lib/iron-session";
import {
  sanitizeUserInput,
  validateSanitizedInput,
} from "@/lib/promptSanitizer";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Lazy-initialized OpenAI client to avoid build-time errors
let _openaiClient: OpenAI | null = null;

function getOpenAIClientWithGateway(): OpenAI {
  if (!_openaiClient) {
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_GATEWAY_API_KEY
      ? 'https://ai-gateway.vercel.sh/v1'
      : undefined;

    if (!apiKey) {
      throw new Error("AI_GATEWAY_API_KEY or OPENAI_API_KEY environment variable is required");
    }

    // PRODUCTION OPTIMIZATION: Added timeout (60s) and retry logic (3 attempts) to prevent hangs
    _openaiClient = new OpenAI({
      apiKey,
      baseURL,
      timeout: 60000,  // 60 seconds - prevents indefinite hangs on slow/unresponsive API
      maxRetries: 3,   // Retry up to 3 times on 500/502/503/504 errors with exponential backoff
    });
  }
  return _openaiClient;
}

// Cache system instructions at module level to avoid rebuilding on every request
const FOLLOWUP_SYSTEM_PROMPT =
  "You are a warm, caring interviewer helping preserve family stories. Generate thoughtful follow-up questions.";

const FOLLOWUP_RULES = `Requirements:
1. EMOTIONAL: About feelings/impact
2. WISDOM: Extract life lessons learned
3. SENSORY: Capture vivid details (sounds, smells, textures, visual details)

Rules:
- Maximum 12 words per question
- Use their exact words when possible
- Warm, conversational tone like a caring granddaughter
- Make questions feel personal and gentle
- If they mentioned someone else, ask about relationships

Return ONLY valid JSON: {"emotional": "", "wisdom": "", "sensory": ""}`;

// Pivotal moment detection keywords
const PIVOTAL_KEYWORDS = {
  turning_points: [
    "decided",
    "realized",
    "understood",
    "changed",
    "moment",
    "suddenly",
  ],
  loss_grief: ["died", "passed", "funeral", "lost", "goodbye", "miss"],
  love: ["fell in love", "married", "met", "wedding", "proposal", "heart"],
  courage: ["scared", "brave", "confronted", "stood up", "fought", "defended"],
  achievement: [
    "proud",
    "accomplished",
    "succeeded",
    "won",
    "graduated",
    "promoted",
  ],
  family: ["born", "baby", "children", "parents", "siblings", "family"],
  friendship: ["friend", "best friend", "met", "together", "loyal", "support"],
  education: [
    "school",
    "teacher",
    "learned",
    "studied",
    "college",
    "university",
  ],
  work: ["job", "career", "boss", "coworker", "promoted", "retired"],
  travel: ["trip", "vacation", "journey", "visited", "adventure", "explore"],
  home: ["house", "moved", "neighborhood", "hometown", "roots", "belonged"],
  health: ["sick", "hospital", "doctor", "recovery", "illness", "healthy"],
  faith: ["believe", "pray", "church", "spiritual", "faith", "divine"],
  creativity: ["created", "made", "artistic", "music", "painting", "writing"],
  nature: ["outdoors", "garden", "animals", "seasons", "weather", "beauty"],
  traditions: [
    "holiday",
    "celebration",
    "tradition",
    "ritual",
    "custom",
    "heritage",
  ],
  struggles: [
    "difficult",
    "hard",
    "challenge",
    "obstacle",
    "overcome",
    "persevere",
  ],
};

function detectPivotalMoments(transcription: string): string[] {
  const text = transcription.toLowerCase();
  const detected: Array<{ category: string; count: number }> = [];

  for (const [category, keywords] of Object.entries(PIVOTAL_KEYWORDS)) {
    const count = keywords.reduce((acc, keyword) => {
      return acc + (text.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);

    if (count > 0) {
      detected.push({ category, count });
    }
  }

  return detected
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item) => item.category);
}

interface FollowUpQuestions {
  emotional: string;
  wisdom: string;
  sensory: string;
}

async function generateFollowUps(
  transcription: string,
  userName: string,
  userAge: number,
): Promise<FollowUpQuestions> {
  // Sanitize user input to prevent prompt injection
  const sanitizedTranscription = sanitizeUserInput(transcription);

  if (!validateSanitizedInput(sanitizedTranscription)) {
    logger.warn("Potential prompt injection detected in transcription");
    throw new Error("Invalid input detected");
  }

  const pivotalCategories = detectPivotalMoments(sanitizedTranscription);

  // Build user-specific instructions using cached base prompt
  const userInstructions = `You are interviewing ${userName}, age ${userAge}, about their life story.
Generate exactly 3 follow-up questions in JSON format.

Detected themes: ${pivotalCategories.join(", ")}

${FOLLOWUP_RULES}`;

  try {
    const openai = getOpenAIClientWithGateway();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: FOLLOWUP_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `${userInstructions}\n\n<transcription>\n${sanitizedTranscription}\n</transcription>`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      emotional: result.emotional || "How did that moment make you feel?",
      wisdom: result.wisdom || "What did you learn from that experience?",
      sensory: result.sensory || "What details do you remember most clearly?",
    };
  } catch (error) {
    logger.error("Follow-up generation error:", error);
    return {
      emotional: "How did that moment make you feel?",
      wisdom: "What would you want your grandchildren to know about this?",
      sensory: "What do you remember seeing, hearing, or smelling?",
    };
  }
}

export async function POST(request: NextRequest) {
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

    // Rate limiting: 30 API requests per minute per user
    const rateLimitResponse = await checkRateLimit(
      `api:followups:${userId}`,
      apiRatelimit,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { transcription } = body;

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription required" },
        { status: 400 },
      );
    }

    logger.api("Generating follow-ups for user:", userId);

    // Get user info from Supabase database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("name, birth_year")
      .eq("id", userId)
      .single();

    if (userError || !dbUser) {
      logger.error("User not found in database:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const userAge = currentYear - dbUser.birth_year;
    const userName = dbUser.name || "User";

    // Generate follow-up questions
    const followUps = await generateFollowUps(transcription, userName, userAge);

    return NextResponse.json({ followUps });
  } catch (error) {
    logger.error("Follow-up generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate follow-ups",
      },
      { status: 500 },
    );
  }
}
