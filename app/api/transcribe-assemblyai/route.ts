import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
import { logger } from "@/lib/logger";
import { apiRatelimit, checkRateLimit, getClientIp } from "@/lib/ratelimit";
import {
  sanitizeUserInput,
  validateSanitizedInput,
} from "@/lib/promptSanitizer";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { nanoid } from "nanoid";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize AssemblyAI client
if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error("ASSEMBLYAI_API_KEY environment variable is required");
}

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

// Initialize OpenAI for formatting and lesson generation (via Gateway)
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

// Cache prompts at module level
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
  const sanitizedText = sanitizeUserInput(rawText);

  if (!validateSanitizedInput(sanitizedText)) {
    logger.warn("Potential prompt injection detected in raw transcription");
    return rawText;
  }

  // Preprocessing
  let preprocessed = sanitizedText;
  preprocessed = preprocessed.replace(/\b(um|uh|uhh|umm|er|ah)\b/gi, '');
  preprocessed = preprocessed.replace(/\s+(like|you know)\s+/gi, ' ');
  preprocessed = preprocessed.replace(/\b(\w+),?\s+\1\b/gi, '$1');
  preprocessed = preprocessed.replace(/\s+/g, ' ').trim();
  preprocessed = preprocessed.replace(/\s+([.,!?;:])/g, '$1');

  try {
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

// Helper function to generate lesson options
async function generateLessonOptions(transcription: string): Promise<{
  practical: string;
  emotional: string;
  character: string;
} | null> {
  const sanitizedTranscription = sanitizeUserInput(transcription);

  if (!validateSanitizedInput(sanitizedTranscription)) {
    logger.warn("Potential prompt injection detected in lesson generation");
    return null;
  }

  try {
    const completion = await openaiGateway.chat.completions.create({
      model: "gpt-4o-mini",
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
      temperature: 0.9,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

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

/**
 * AssemblyAI Batch Transcription API
 *
 * PERFORMANCE: Target ~1-2s (vs 3-5s with Whisper)
 * COST: $0.0025/min (58% cheaper than Whisper)
 *
 * Uses AssemblyAI's "universal" speech model (balanced default):
 * - Industry-leading accuracy (93.4% word accuracy, 6.6% WER)
 * - Faster than Whisper
 * - Good balance of speed, accuracy, and cost
 *
 * Model options: "nano" (fastest), "universal" (balanced), "best" (most accurate)
 * Fallback to Whisper at /api/transcribe if needed
 */
export async function POST(request: NextRequest) {
  logger.debug("[TranscribeAssemblyAI] POST request received");

  try {
    const contentType = request.headers.get("content-type");
    const isFormData = contentType?.includes("multipart/form-data");

    logger.debug("[TranscribeAssemblyAI] Content-Type:", contentType, "IsFormData:", isFormData);

    let user = null;
    let audioBuffer: Buffer;

    if (isFormData) {
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        logger.error("[TranscribeAssemblyAI] No audio file in FormData");
        return NextResponse.json(
          { error: "No audio file provided" },
          { status: 400 },
        );
      }

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
      const authHeader = request.headers.get("authorization");
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

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
      const { audioBase64 } = body;

      if (!audioBase64) {
        return NextResponse.json(
          { error: "No audio data provided" },
          { status: 400 },
        );
      }

      audioBuffer = Buffer.from(audioBase64, "base64");
    }

    // Rate limiting
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

    // Check size limits
    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file too large. Maximum size is 25MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 },
      );
    }

    // Save to temp file
    const tempDir =
      process.env.NODE_ENV === "production"
        ? "/tmp"
        : path.join(process.cwd(), "temp");

    if (process.env.NODE_ENV !== "production" && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `audio_${Date.now()}_${nanoid()}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      logger.api("Transcribing with AssemblyAI for user:", user?.id || "anonymous");

      const startTime = Date.now();

      // Upload and transcribe with AssemblyAI
      const transcript = await assemblyai.transcripts.transcribe({
        audio: tempFilePath,
        speech_model: "universal", // Balanced model - good accuracy and speed (default)
        language_detection: true,
        punctuate: true,
        format_text: true,
      });

      const transcriptionLatency = Date.now() - startTime;

      logger.api("[TranscribeAssemblyAI] Transcription complete", {
        latencyMs: transcriptionLatency,
        status: transcript.status,
        confidence: transcript.confidence,
      });

      if (transcript.status === "error") {
        throw new Error(transcript.error || "AssemblyAI transcription failed");
      }

      const rawText = transcript.text || "";

      // Get file stats for duration
      const stats = fs.statSync(tempFilePath);
      const fileSizeInBytes = stats.size;
      const estimatedDuration = Math.round((fileSizeInBytes / (1024 * 1024)) * 60);

      // Run formatting and lesson extraction in parallel
      const [formattedText, lessonOptions] = await Promise.all([
        formatTranscription(rawText).catch((error) => {
          logger.warn("Failed to format transcription, using raw text:", error);
          return rawText;
        }),
        generateLessonOptions(rawText).catch((error) => {
          logger.warn("Failed to generate lesson options:", error);
          return null;
        }),
      ]);

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Log telemetry
      logger.api("[TranscribeAssemblyAI] Success", {
        userId: user?.id,
        transcriptionLatencyMs: transcriptionLatency,
        totalLatencyMs: Date.now() - startTime,
        confidence: transcript.confidence,
        textLength: rawText.length,
      });

      return NextResponse.json({
        transcription: formattedText,
        text: formattedText,
        duration: estimatedDuration,
        lessonOptions: lessonOptions || {
          practical: "Every experience teaches something if you're willing to learn from it",
          emotional: "The heart remembers what the mind forgets",
          character: "Who you become matters more than what you achieve",
        },
        formattedContent: {
          formattedText: formattedText,
        },
        _meta: {
          provider: "assemblyai",
          transcriptionLatencyMs: transcriptionLatency,
          confidence: transcript.confidence,
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
    logger.error("[TranscribeAssemblyAI] ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 },
    );
  }
}
