import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadRatelimit, checkRateLimit } from "@/lib/ratelimit";
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

// Note: Using admin client for storage to bypass RLS policies

export async function POST(request: NextRequest) {
  try {
    // Log the Content-Type header to debug
    const requestContentType = request.headers.get("content-type");
    logger.debug("[Audio Upload] Request Content-Type:", requestContentType);

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

    // Rate limiting: 10 uploads per minute per user
    const rateLimitResponse = await checkRateLimit(`upload:audio:${user.id}`, uploadRatelimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | Blob;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Log the received file details for debugging
    logger.debug("Received audio file:", {
      name: audioFile instanceof File ? audioFile.name : "blob",
      size: audioFile.size,
      type: audioFile.type,
      isFile: audioFile instanceof File,
      isBlob: audioFile instanceof Blob,
    });

    // Check for invalid MIME types
    const contentType = audioFile.type || "audio/webm";
    if (contentType === "text/plain" || contentType.startsWith("text/")) {
      return NextResponse.json({
        error: "Invalid audio file type",
        details: `MIME type ${contentType} is not supported. Please upload an audio file.`
      }, { status: 400 });
    }

    // Determine file extension from MIME type
    let fileExtension = "webm";

    // Strip codec information from MIME type for Supabase compatibility
    const baseType = contentType.split(';')[0];

    // Map MIME types to file extensions
    // We'll let Supabase infer content type from extension
    if (baseType === "audio/mpeg" || baseType === "audio/mp3") {
      fileExtension = "mp3";
    } else if (baseType === "audio/wav" || baseType === "audio/wave") {
      fileExtension = "wav";
    } else if (baseType === "audio/ogg") {
      fileExtension = "ogg";
    } else if (baseType === "audio/mp4" || baseType === "audio/m4a") {
      fileExtension = "m4a";
    } else if (baseType === "video/webm" || baseType === "audio/webm") {
      fileExtension = "webm";
    } else {
      // Default to webm for unknown types
      fileExtension = "webm";
    }

    // Generate unique filename with audio/ prefix for heritage-whisper-files bucket
    const timestamp = Date.now();
    const filename = `audio/${user.id}/${timestamp}-recording.${fileExtension}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Normalize content type - convert video/webm to audio/webm (common browser recorder format)
    let uploadContentType = audioFile.type;
    if (baseType === "video/webm") {
      uploadContentType = "audio/webm";
      logger.debug("[Audio Upload] Normalized video/webm to audio/webm");
    }

    // Upload with normalized MIME type
    const { data, error } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(filename, buffer, {
        contentType: uploadContentType,
        upsert: false,
      });

    if (error) {
      logger.error("Supabase upload error:", error);
      logger.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      });
      return NextResponse.json({
        error: "Failed to upload audio",
        details: error.message
      }, { status: 500 });
    }

    // Get public URL from heritage-whisper-files bucket
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("heritage-whisper-files")
      .getPublicUrl(filename);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filename
    });
  } catch (error) {
    logger.error("Audio upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to upload audio",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}