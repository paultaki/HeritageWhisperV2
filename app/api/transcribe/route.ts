import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { apiRatelimit, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import {
  sanitizeUserInput,
  validateSanitizedInput,
} from "@/lib/promptSanitizer";
import * as fs from "fs";
import * as path from "path";
import { nanoid } from "nanoid";
import { checkAIConsentOrError } from "@/lib/aiConsent";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize TWO OpenAI clients:
// 1. Direct OpenAI for Whisper (AI Gateway doesn't support audio endpoints)
// 2. AI Gateway for chat completions (GPT-4, GPT-4o-mini)

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// Direct OpenAI client for Whisper transcription
// PRODUCTION OPTIMIZATION: Added timeout (60s) and retry logic (3 attempts) to prevent hangs
const openaiDirect = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds - prevents indefinite hangs on slow/unresponsive API
  maxRetries: 3,  // Retry up to 3 times on 500/502/503/504 errors with exponential backoff
});

// AI Gateway client for chat completions (formatting, lesson generation)
const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
const gatewayBaseURL = process.env.AI_GATEWAY_API_KEY
  ? 'https://ai-gateway.vercel.sh/v1'
  : undefined;

const openaiGateway = new OpenAI({
  apiKey: gatewayApiKey,
  baseURL: gatewayBaseURL,
  timeout: 60000, // 60 seconds - prevents indefinite hangs
  maxRetries: 3,  // Automatic retry on transient failures
});

// Cache prompts at module level to avoid rebuilding on every request
const FORMATTING_SYSTEM_PROMPT =
  "You are a skilled memoir editor who transforms transcribed speech into beautifully formatted stories while preserving the speaker's authentic voice.";

const FORMATTING_GUIDELINES = `You are a professional editor helping to clean up and format transcribed speech into a beautifully readable story for a memory book.

Guidelines for formatting:
1. Remove filler words like "um", "uh", "uhh", "umm", "er", "ah" etc.
2. Fix obvious grammar mistakes while preserving the speaker's authentic voice
3. Add proper punctuation and capitalization
4. CREATE CLEAR PARAGRAPHS:
   - Start a new paragraph when the topic changes
   - Start a new paragraph when the time period shifts
   - Start a new paragraph when describing different people or places
   - Start a new paragraph for dialogue or quotes
   - Aim for 3-5 sentences per paragraph on average
   - Single-sentence paragraphs are fine for emphasis
5. Remove repeated words or false starts (e.g., "I was, I was going" → "I was going")
6. Keep all important content and meaning intact
7. Preserve emotional tone and personal expressions
8. Make sure the story flows naturally, like reading from a memoir
9. DO NOT add any new content or change the meaning
10. Ensure proper spacing between paragraphs (use double line breaks)

Return ONLY the cleaned and formatted text with proper paragraph breaks. No explanations or commentary.`;

const LESSON_EXTRACTION_SYSTEM_PROMPT = `You are extracting life lessons from personal stories.

Your goal is to find the wisdom that can be passed to future generations.
Each lesson should be 15-20 words, clear, and meaningful.

Avoid:
- Generic platitudes ("Be yourself", "Follow your heart")
- Overly specific details that won't apply to others
- Negative framing ("Don't trust people")
- Abstract philosophy

Focus on:
- Universal truths discovered through personal experience
- Practical wisdom that guides decisions
- Character insights that shape who we become
- The cost and value of choices made`;

const LESSON_EXTRACTION_PROMPT = `From this story, extract 3 different types of lessons:

1. PRACTICAL LESSON (what to DO in similar situations)
2. EMOTIONAL TRUTH (what to FEEL or how to process emotions)
3. CHARACTER INSIGHT (who to BE or what kind of person to become)

Return exactly 3 lessons, each 15-20 words, formatted as:
PRACTICAL: [lesson]
EMOTIONAL: [lesson]
CHARACTER: [lesson]`;

// Helper function to format transcription
async function formatTranscription(rawText: string): Promise<string> {
  // Sanitize input to prevent prompt injection
  const sanitizedText = sanitizeUserInput(rawText);

  if (!validateSanitizedInput(sanitizedText)) {
    logger.warn("Potential prompt injection detected in raw transcription");
    return rawText; // Return original on injection attempt
  }

  // Preprocessing: Clean up common issues before GPT formatting
  let preprocessed = sanitizedText;
  
  // 1. Remove filler words (deterministic, more reliable than GPT alone)
  preprocessed = preprocessed.replace(/\b(um|uh|uhh|umm|er|ah)\b/gi, '');
  
  // 2. Remove "like" and "you know" when used as fillers (not when meaningful)
  // Only remove when surrounded by spaces or at sentence boundaries
  preprocessed = preprocessed.replace(/\s+(like|you know)\s+/gi, ' ');
  
  // 3. Remove repeated false starts: "I was, I was going" → "I was going"
  // Matches: word, optional comma, space, same word
  preprocessed = preprocessed.replace(/\b(\w+),?\s+\1\b/gi, '$1');
  
  // 4. Clean up multiple spaces and trim
  preprocessed = preprocessed.replace(/\s+/g, ' ').trim();
  
  // 5. Remove spaces before punctuation
  preprocessed = preprocessed.replace(/\s+([.,!?;:])/g, '$1');

  try {
    // Use GPT-4o-mini for formatting (cost: ~$0.001 vs $0.007)
    // Formatting is simpler than lesson extraction, doesn't need GPT-4o
    const completion = await openaiGateway.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: FORMATTING_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `${FORMATTING_GUIDELINES}\n\n<transcribed_speech>\n${preprocessed}\n</transcribed_speech>`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const formatted = completion.choices[0]?.message?.content;

    if (formatted && formatted.trim().length > 0) {
      return formatted.trim();
    }

    return rawText;
  } catch (error) {
    logger.error("Formatting error:", error);
    return rawText;
  }
}

// Helper function to generate 3 lesson options (practical, emotional, character)
async function generateLessonOptions(transcription: string): Promise<{
  practical: string;
  emotional: string;
  character: string;
} | null> {
  // Sanitize input to prevent prompt injection
  const sanitizedTranscription = sanitizeUserInput(transcription);

  if (!validateSanitizedInput(sanitizedTranscription)) {
    logger.warn("Potential prompt injection detected in lesson generation");
    return null;
  }

  try {
    const completion = await openaiGateway.chat.completions.create({
      model: "gpt-4o-mini", // Switched from gpt-4o: 10x cheaper, template-driven task
      messages: [
        {
          role: "system",
          content: LESSON_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `${LESSON_EXTRACTION_PROMPT}

<story>
${sanitizedTranscription}
</story>`,
        },
      ],
      temperature: 0.9, // Slightly higher for creativity with smaller model
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    // Parse the response
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let practical = "";
    let emotional = "";
    let character = "";

    for (const line of lines) {
      if (line.toUpperCase().startsWith("PRACTICAL:")) {
        practical = line.replace(/^PRACTICAL:\s*/i, "").trim();
      } else if (line.toUpperCase().startsWith("EMOTIONAL:")) {
        emotional = line.replace(/^EMOTIONAL:\s*/i, "").trim();
      } else if (line.toUpperCase().startsWith("CHARACTER:")) {
        character = line.replace(/^CHARACTER:\s*/i, "").trim();
      }
    }

    // Fallback if parsing fails
    if (!practical || !emotional || !character) {
      const fallbacks = lines.filter(
        (l) => !l.match(/^(PRACTICAL|EMOTIONAL|CHARACTER):/i),
      );
      practical =
        practical ||
        fallbacks[0] ||
        "Every experience teaches something if you're willing to learn from it";
      emotional =
        emotional ||
        fallbacks[1] ||
        "The heart remembers what the mind forgets";
      character =
        character ||
        fallbacks[2] ||
        "Who you become matters more than what you achieve";
    }

    return { practical, emotional, character };
  } catch (error) {
    logger.error("Lesson generation error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  logger.debug("[Transcribe] POST request received");
  // REMOVED: Sensitive data logging - console.log('[Transcribe] Headers:', Object.fromEntries(request.headers.entries()));

  try {
    logger.debug("[Transcribe] Inside try block");

    // Check if the request is FormData or JSON
    const contentType = request.headers.get("content-type");
    const isFormData = contentType?.includes("multipart/form-data");

    logger.debug(
      "[Transcribe] Content-Type:",
      contentType,
      "IsFormData:",
      isFormData,
    );

    // For FormData (from BookStyleReview), auth is optional
    // For JSON (from recording page), auth is required
    let user = null;
    let audioBuffer: Buffer;

    if (isFormData) {
      logger.debug("[Transcribe] Processing FormData upload");

      // Handle FormData upload
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        logger.error("[Transcribe] No audio file in FormData");
        return NextResponse.json(
          { error: "No audio file provided" },
          { status: 400 },
        );
      }

      logger.debug("[Transcribe] Audio file received:", {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
      });

      // Convert File to Buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

      // Try to get auth if available
      const authHeader = request.headers.get("authorization");
      const token = authHeader && authHeader.split(" ")[1];
      if (token) {
        const { data } = await supabaseAdmin.auth.getUser(token);
        user = data.user;
      }
    } else {
      // Handle JSON upload (existing flow)
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
        data: { user: authUser },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !authUser) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }
      user = authUser;

      const body = await request.json();
      const { audioBase64, mimeType, title } = body;

      if (!audioBase64) {
        return NextResponse.json(
          { error: "No audio data provided" },
          { status: 400 },
        );
      }

      // Convert base64 to buffer
      audioBuffer = Buffer.from(audioBase64, "base64");
    }

    // Check AI consent (only for authenticated users)
    if (user) {
      const consentError = await checkAIConsentOrError(user.id);
      if (consentError) {
        logger.warn("[Transcribe] AI consent denied for user:", user.id);
        return NextResponse.json(consentError, { status: 403 });
      }
    }

    // Rate limiting: 30 API requests per minute per user (or IP if no auth)
    const rateLimitIdentifier = user
      ? `api:transcribe:${user.id}`
      : `api:transcribe:ip:${getClientIp(request)}`;
    const rateLimitResponse = await checkRateLimit(
      rateLimitIdentifier,
      apiRatelimit,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check size limits (25MB max for OpenAI Whisper)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file too large. Maximum size is 25MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 },
      );
    }

    // Save to temp file for OpenAI processing
    // Use /tmp in production (Vercel), or local temp directory in development
    const tempDir =
      process.env.NODE_ENV === "production"
        ? "/tmp"
        : path.join(process.cwd(), "temp");

    if (process.env.NODE_ENV !== "production" && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `audio_${Date.now()}_${nanoid()}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Write buffer to file
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      logger.api("Transcribing audio for user:", user?.id || "anonymous");

      // Create a readable stream from the file
      const audioReadStream = fs.createReadStream(tempFilePath);

      // Transcribe using OpenAI Whisper (direct API, not Gateway)
      const transcription = await openaiDirect.audio.transcriptions.create({
        file: audioReadStream as any,
        model: "whisper-1",
      });

      // Get file stats for duration estimation
      const stats = fs.statSync(tempFilePath);
      const fileSizeInBytes = stats.size;
      // Rough estimation: 1MB ≈ 60 seconds for typical audio quality
      const estimatedDuration = Math.round(
        (fileSizeInBytes / (1024 * 1024)) * 60,
      );

      // Run formatting and lesson extraction IN PARALLEL for speed
      const [formattedText, lessonOptions] = await Promise.all([
        formatTranscription(transcription.text).catch((error) => {
          logger.warn("Failed to format transcription, using raw text:", error);
          return transcription.text;
        }),
        generateLessonOptions(transcription.text).catch((error) => {
          logger.warn("Failed to generate lesson options:", error);
          return null;
        }),
      ]);

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Return the transcription and lesson options
      // Include both 'transcription' and 'text' for backwards compatibility
      return NextResponse.json({
        transcription: formattedText,
        text: formattedText, // Add for backwards compatibility
        duration: estimatedDuration,
        lessonOptions: lessonOptions || {
          practical:
            "Every experience teaches something if you're willing to learn from it",
          emotional: "The heart remembers what the mind forgets",
          character: "Who you become matters more than what you achieve",
        },
        formattedContent: {
          formattedText: formattedText,
        },
      });
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    logger.error("[Transcribe] ERROR caught:", error);
    logger.error("[Transcribe] Error type:", typeof error);
    logger.error(
      "[Transcribe] Error instanceof Error:",
      error instanceof Error,
    );
    if (error instanceof Error) {
      logger.error("[Transcribe] Error message:", error.message);
      logger.error("[Transcribe] Error stack:", error.stack);
    }
    logger.error("Transcription error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 },
    );
  }
}
