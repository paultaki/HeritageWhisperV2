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

import { getPasskeySession } from "@/lib/iron-session";
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openaiDirect = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 3,
});

const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
const gatewayBaseURL = process.env.AI_GATEWAY_API_KEY
  ? 'https://ai-gateway.vercel.sh/v1'
  : undefined;

const openaiGateway = new OpenAI({
  apiKey: gatewayApiKey,
  baseURL: gatewayBaseURL,
  timeout: 60000,
  maxRetries: 3,
});

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

async function formatTranscription(rawText: string): Promise<string> {
  const sanitizedText = sanitizeUserInput(rawText);

  if (!validateSanitizedInput(sanitizedText)) {
    logger.warn("Potential prompt injection detected in raw transcription");
    return rawText;
  }

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
 * OpenAI Whisper Transcription API
 * 
 * Dedicated endpoint for testing Whisper transcription quality.
 * Uses same formatting pipeline as AssemblyAI for fair comparison.
 * 
 * PERFORMANCE: ~9-12s transcription
 * COST: $0.006/min (2.4x more expensive than AssemblyAI)
 * ACCURACY: 10.6% WER (vs AssemblyAI 8.7%)
 */
export async function POST(request: NextRequest) {
  logger.debug("[TranscribeWhisper] POST request received");

  try {
    const contentType = request.headers.get("content-type");
    const isFormData = contentType?.includes("multipart/form-data");

    let user = null;
    let audioBuffer: Buffer;

    if (isFormData) {
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        logger.error("[TranscribeWhisper] No audio file in FormData");
        return NextResponse.json(
          { error: "No audio file provided" },
          { status: 400 },
        );
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

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
    const userId = user?.id;

    if (user) {
      const consentError = await checkAIConsentOrError(userId!);
      if (consentError) {
        logger.warn("[TranscribeWhisper] AI consent denied for user:", userId);
        return NextResponse.json(consentError, { status: 403 });
      }
    }

    const rateLimitIdentifier = user
      ? `api:transcribe:whisper:${userId}`
      : `api:transcribe:whisper:ip:${getClientIp(request)}`;
    const rateLimitResponse = await checkRateLimit(
      rateLimitIdentifier,
      apiRatelimit,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file too large. Maximum size is 25MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 },
      );
    }

    const tempDir =
      process.env.NODE_ENV === "production"
        ? "/tmp"
        : path.join(process.cwd(), "temp");

    if (process.env.NODE_ENV !== "production" && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `audio_whisper_${Date.now()}_${nanoid()}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      logger.api("Transcribing with Whisper for user:", user?.id || "anonymous");

      const transcriptionStart = Date.now();

      const audioReadStream = fs.createReadStream(tempFilePath);

      const transcription = await openaiDirect.audio.transcriptions.create({
        file: audioReadStream as any,
        model: "whisper-1",
      });

      const transcriptionLatency = Date.now() - transcriptionStart;

      const stats = fs.statSync(tempFilePath);
      const fileSizeInBytes = stats.size;
      const estimatedDuration = Math.round((fileSizeInBytes / (1024 * 1024)) * 60);

      const formatStart = Date.now();
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
      const formattingLatency = Date.now() - formatStart;

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      logger.api("[TranscribeWhisper] Success", {
        userId: user?.id,
        transcriptionLatencyMs: transcriptionLatency,
        formattingLatencyMs: formattingLatency,
        totalLatencyMs: Date.now() - transcriptionStart,
        textLength: transcription.text.length,
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
          provider: "whisper",
          transcriptionLatencyMs: transcriptionLatency,
          formattingLatencyMs: formattingLatency,
        },
      });
    } catch (error) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    logger.error("[TranscribeWhisper] ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 },
    );
  }
}
