import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Determine file extension and content type
    let fileExtension = "webm";
    let contentType = audioFile.type || "audio/webm";

    // Map MIME types to supported formats
    if (audioFile.type === "audio/mpeg" || audioFile.type === "audio/mp3") {
      fileExtension = "mp3";
      contentType = "audio/mpeg";
    } else if (audioFile.type === "audio/wav" || audioFile.type === "audio/wave") {
      fileExtension = "wav";
      contentType = "audio/wav";
    } else if (audioFile.type === "audio/ogg") {
      fileExtension = "ogg";
      contentType = "audio/ogg";
    } else if (audioFile.type === "audio/mp4" || audioFile.type === "audio/m4a") {
      fileExtension = "m4a";
      contentType = "audio/mp4";
    } else if (audioFile.type === "video/webm" || audioFile.type === "audio/webm") {
      fileExtension = "webm";
      contentType = "audio/webm";
    }

    // Generate unique filename with audio/ prefix for heritage-whisper-files bucket
    const timestamp = Date.now();
    const filename = `audio/${user.id}/${timestamp}-recording.${fileExtension}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(filename, buffer, {
        contentType: contentType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      console.error("Error details:", {
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
    console.error("Audio upload error:", error);
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