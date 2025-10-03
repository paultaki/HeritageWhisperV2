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

    // Get the photo file from the request
    const formData = await request.formData();
    const photoFile = formData.get("photo") as File;
    const storyId = formData.get("storyId") as string;

    if (!photoFile) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 400 });
    }

    // Generate unique filename with photo/ prefix for heritage-whisper-files bucket
    const timestamp = Date.now();
    const extension = photoFile.name.split('.').pop() || 'jpg';
    const filename = `photo/${user.id}/${storyId || 'temp'}/${timestamp}.${extension}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(filename, buffer, {
        contentType: photoFile.type || "image/jpeg",
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