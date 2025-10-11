import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { apiRatelimit, checkRateLimit } from "@/lib/ratelimit";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Verify that a file exists in Supabase Storage WITHOUT downloading it
 * Uses metadata/list check to avoid pulling 50MB files into memory
 */
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

    // Rate limiting: 30 API requests per minute per user
    const rateLimitResponse = await checkRateLimit(`api:verify-upload:${user.id}`, apiRatelimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { filePath, expectedSize } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 }
      );
    }

    logger.debug(`Verifying upload for: ${filePath}`);

    // Use list() with prefix to check if file exists WITHOUT downloading
    // This is much more efficient than download() for large files
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        limit: 100,
        offset: 0,
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });

    if (listError) {
      logger.error('File verification failed:', listError);
      return NextResponse.json({
        exists: false,
        error: listError.message
      });
    }

    // Check if file exists in the list
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const fileInfo = files?.find(f => f.name === fileName);

    if (!fileInfo) {
      logger.debug(`File not found: ${filePath}`);
      return NextResponse.json({
        exists: false
      });
    }

    // Get file metadata (size) from the list response
    const actualSize = fileInfo.metadata?.size || 0;

    // Optionally validate size matches expected
    if (expectedSize && actualSize !== expectedSize) {
      logger.warn(`File size mismatch for ${filePath}: expected ${expectedSize}, got ${actualSize}`);
    }

    logger.debug(`File verified: ${filePath} (${actualSize} bytes)`);

    return NextResponse.json({
      exists: true,
      size: actualSize,
      id: fileInfo.id,
      updatedAt: fileInfo.updated_at,
      createdAt: fileInfo.created_at
    });

  } catch (error) {
    logger.error("File verification error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify upload"
      },
      { status: 500 }
    );
  }
}
