import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadRatelimit, checkRateLimit } from "@/lib/ratelimit";

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
    const rateLimitResponse = await checkRateLimit(`upload:photo:${user.id}`, uploadRatelimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get the photo file from the request
    const formData = await request.formData();
    const photoFile = formData.get("photo") as File;
    const storyId = formData.get("storyId") as string;

    if (!photoFile) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 400 });
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate that it's actually an image
    const { validateImage, processImage } = await import("@/lib/imageProcessor");
    const isValidImage = await validateImage(buffer);

    if (!isValidImage) {
      return NextResponse.json(
        {
          error: "Invalid image file",
          details: "The uploaded file is not a valid image or has invalid dimensions"
        },
        { status: 400 }
      );
    }

    // Process image: strip EXIF data, optimize, and convert to standard format
    const { buffer: processedBuffer, contentType } = await processImage(buffer, {
      maxWidth: 2400,
      maxHeight: 2400,
      quality: 85,
      format: "jpeg", // Convert all photos to JPEG for consistency
    });

    // Generate unique filename with photo/ prefix for heritage-whisper-files bucket
    const timestamp = Date.now();
    const filename = `photo/${user.id}/${storyId || 'temp'}/${timestamp}.jpg`;

    // Upload processed image to Supabase Storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(filename, processedBuffer, {
        contentType, // Use the content type from processed image
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({
        error: "Failed to upload photo",
        details: error.message
      }, { status: 500 });
    }

    // Generate a signed URL for immediate display
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .createSignedUrl(filename, 604800); // 1 week expiry

    return NextResponse.json({
      url: signedUrlData?.signedUrl || filename,
      path: filename,
      filePath: filename
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to upload photo",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}