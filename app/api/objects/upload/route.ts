import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST generate signed upload URL
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

    const body = await request.json();
    const { fileType, storyId, fileExtension } = body;

    if (!fileType || !fileExtension) {
      return NextResponse.json(
        { error: "File type and extension are required" },
        { status: 400 },
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomId}.${fileExtension}`;

    // Use single bucket with subfolders for paultaki project structure
    const bucketName = "heritage-whisper-files";
    let filePath: string;

    if (fileType === "photo") {
      // Photos go in photo/ subfolder
      filePath = `photo/${userId}/${storyId || "temp"}/${fileName}`;
    } else if (fileType === "audio") {
      // Audio goes in audio/ subfolder
      filePath = `audio/${userId}/${storyId || "temp"}/${fileName}`;
    } else {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Create signed upload URL (valid for 10 minutes)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (uploadError) {
      logger.error("Error creating signed upload URL:", uploadError);
      return NextResponse.json(
        { error: "Failed to create upload URL", details: uploadError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      uploadURL: uploadData.signedUrl,
      filePath: filePath,
      token: uploadData.token,
    });
  } catch (error) {
    logger.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
