import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import * as fs from "fs";
import * as path from "path";
import { nanoid } from "nanoid";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to format transcription
async function formatTranscription(rawText: string): Promise<string> {
  try {
    const systemInstructions = `You are a professional editor helping to clean up and format transcribed speech into readable text.

Guidelines for formatting:
1. Remove filler words like "um", "uh", "uhh", "umm", "er", "ah" etc.
2. Fix obvious grammar mistakes while preserving the speaker's authentic voice
3. Add proper punctuation and capitalization
4. Break into natural paragraphs where topic or thought shifts occur
5. Remove repeated words or false starts (e.g., "I was, I was going" → "I was going")
6. Keep all important content and meaning intact
7. Preserve emotional tone and personal expressions
8. DO NOT add any new content or change the meaning

Return ONLY the cleaned and formatted text with no explanations or commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a skilled transcription editor who cleans up speech-to-text while preserving authenticity."
        },
        {
          role: "user",
          content: `${systemInstructions}\n\nText to format:\n"${rawText}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
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

// Helper function to generate wisdom/lesson learned suggestion
async function generateWisdomSuggestion(transcription: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a thoughtful helper extracting life lessons and wisdom from personal stories."
        },
        {
          role: "user",
          content: `Based on this personal story, suggest a brief lesson learned or piece of wisdom (1-2 sentences) that captures the essence of what this memory teaches:

Story: "${transcription}"

Provide only the lesson/wisdom, no explanations or preamble.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const wisdom = completion.choices[0]?.message?.content;
    return wisdom ? wisdom.trim() : null;
  } catch (error) {
    logger.error("Wisdom generation error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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
        { status: 401 }
      );
    }

    const body = await request.json();
    const { audioBase64, mimeType, title } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Check size limits (25MB max for OpenAI Whisper)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file too large. Maximum size is 25MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`
        },
        { status: 400 }
      );
    }

    // Save to temp file for OpenAI processing
    // Use /tmp in production (Vercel), or local temp directory in development
    const tempDir = process.env.NODE_ENV === 'production'
      ? '/tmp'
      : path.join(process.cwd(), 'temp');

    if (process.env.NODE_ENV !== 'production' && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `audio_${Date.now()}_${nanoid()}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Write buffer to file
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      logger.api("Transcribing audio for user:", user.id);

      // Create a readable stream from the file
      const audioReadStream = fs.createReadStream(tempFilePath);

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioReadStream as any,
        model: "whisper-1",
      });

      // Get file stats for duration estimation
      const stats = fs.statSync(tempFilePath);
      const fileSizeInBytes = stats.size;
      // Rough estimation: 1MB ≈ 60 seconds for typical audio quality
      const estimatedDuration = Math.round(fileSizeInBytes / (1024 * 1024) * 60);

      // Format the transcription
      let formattedText = transcription.text;
      try {
        formattedText = await formatTranscription(transcription.text);
      } catch (formatError) {
        logger.warn("Failed to format transcription, using raw text:", formatError);
      }

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Return the transcription
      return NextResponse.json({
        transcription: formattedText,
        duration: estimatedDuration,
      });

    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }

  } catch (error) {
    logger.error("Transcription error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to transcribe audio"
      },
      { status: 500 }
    );
  }
}
