import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import * as fs from "fs";
import * as path from "path";
import { nanoid } from "nanoid";

// Initialize OpenAI client for Whisper (direct API, not Gateway)
// AI Gateway doesn't support audio endpoints
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Incremental Audio Transcription API
 *
 * CRITICAL: This endpoint processes ONLY NEW audio chunks, never re-transcribes.
 * The client is responsible for:
 * 1. Tracking lastBytePosition to slice only NEW audio
 * 2. Sending only the delta (new chunk) to this API
 * 3. Appending transcriptions to fullTranscript on their end
 *
 * This design ensures we never pay for the same audio twice.
 *
 * Cost: ~$0.006 per minute of audio (Whisper-1 at $0.006/min)
 */
export async function POST(request: NextRequest) {
  logger.debug("[TranscribeChunk] POST request received");

  try {
    // Handle FormData upload (audio chunk as file)
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      logger.error("[TranscribeChunk] No audio file in FormData");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    logger.debug("[TranscribeChunk] Audio file received:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Check size limits (25MB max for OpenAI Whisper)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio chunk too large. Maximum size is 25MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 }
      );
    }

    // Check minimum size (prevent empty chunks)
    const MIN_SIZE = 1024; // 1KB minimum
    if (audioBuffer.length < MIN_SIZE) {
      logger.warn("[TranscribeChunk] Audio chunk too small:", audioBuffer.length);
      return NextResponse.json(
        { transcription: "" }, // Return empty string for tiny chunks
        { status: 200 }
      );
    }

    // Save to temp file for OpenAI processing
    const tempDir =
      process.env.NODE_ENV === "production"
        ? "/tmp"
        : path.join(process.cwd(), "temp");

    if (process.env.NODE_ENV !== "production" && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `chunk_${Date.now()}_${nanoid()}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Write buffer to file
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      logger.api("[TranscribeChunk] Transcribing audio chunk...");

      // Create a readable stream from the file
      const audioReadStream = fs.createReadStream(tempFilePath);

      // Transcribe using OpenAI Whisper (direct API, not Gateway)
      const transcription = await openai.audio.transcriptions.create({
        file: audioReadStream as any,
        model: "whisper-1",
        language: "en", // Explicitly set English for better accuracy
      });

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      logger.debug("[TranscribeChunk] Transcription successful:", {
        length: transcription.text.length,
        preview: transcription.text.substring(0, 100),
      });

      // Return the raw transcription (no formatting, keep it simple)
      return NextResponse.json({
        transcription: transcription.text.trim(),
      });

    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    logger.error("[TranscribeChunk] ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to transcribe audio chunk",
      },
      { status: 500 }
    );
  }
}
