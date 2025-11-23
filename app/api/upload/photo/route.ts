import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { getPasskeySession } from "@/lib/iron-session";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

    // Rate limiting: 10 uploads per minute per user
    const rateLimitResponse = await checkRateLimit(
      `upload:photo:${userId}`,
      uploadRatelimit,
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get the photo file from the request
    const formData = await request.formData();
    const photoFile = formData.get("photo") as File;
    const storyId = formData.get("storyId") as string;

    if (!photoFile) {
      return NextResponse.json(
        { error: "No photo file provided" },
        { status: 400 },
      );
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate that it's actually an image
    const { validateImage, processImageToWebP } = await import(
      "@/lib/imageProcessor"
    );
    const isValidImage = await validateImage(buffer);

    if (!isValidImage) {
      return NextResponse.json(
        {
          error: "Invalid image file",
          details:
            "The uploaded file is not a valid image or has invalid dimensions",
        },
        { status: 400 },
      );
    }

    // Process image to dual WebP versions (Master + Display)
    const { master, display } = await processImageToWebP(buffer);

    // Generate unique filenames with suffix naming
    const timestamp = Date.now();
    const baseFilename = `photo/${userId}/${storyId || "temp"}/${timestamp}`;
    const masterFilename = `${baseFilename}-master.webp`;
    const displayFilename = `${baseFilename}-display.webp`;

    // Upload Master WebP (2400px @ 85% quality)
    const { error: masterError } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(masterFilename, master.buffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (masterError) {
      logger.error("Master WebP upload error:", masterError);
      return NextResponse.json(
        {
          error: "Failed to upload master photo",
          details: masterError.message,
        },
        { status: 500 },
      );
    }

    // Upload Display WebP (550px @ 80% quality)
    const { error: displayError } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(displayFilename, display.buffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (displayError) {
      logger.error("Display WebP upload error:", displayError);
      // Clean up master file if display upload fails
      await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .remove([masterFilename]);
      return NextResponse.json(
        {
          error: "Failed to upload display photo",
          details: displayError.message,
        },
        { status: 500 },
      );
    }

    // Generate signed URLs for immediate display (1 week expiry)
    const { data: masterSignedUrl } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .createSignedUrl(masterFilename, 604800);

    const { data: displaySignedUrl } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .createSignedUrl(displayFilename, 604800);

    return NextResponse.json({
      masterPath: masterFilename,
      displayPath: displayFilename,
      masterUrl: masterSignedUrl?.signedUrl || masterFilename,
      displayUrl: displaySignedUrl?.signedUrl || displayFilename,
      // DEPRECATED (for backward compatibility):
      url: displaySignedUrl?.signedUrl || displayFilename,
      path: displayFilename,
      filePath: displayFilename,
    });
  } catch (error) {
    logger.error("Photo upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to upload photo",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
