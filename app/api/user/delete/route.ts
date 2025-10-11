import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { stories, users, userAgreements, sharedAccess, familyMembers, familyActivity } from "@/shared/schema";
import { eq } from "drizzle-orm";
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

/**
 * DELETE /api/user/delete
 * Permanently delete user account and all associated data
 *
 * GDPR/CCPA Compliance: Right to erasure
 * This endpoint:
 * 1. Deletes all user stories from database
 * 2. Deletes all uploaded files (photos, audio) from storage
 * 3. Deletes user agreements and shared access records
 * 4. Deletes the user from auth.users (Supabase Auth)
 * 5. Deletes the user record from public.users
 */
export async function DELETE(request: NextRequest) {
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

    const userId = user.id;

    logger.debug(`[Account Deletion] Starting deletion process for user: ${userId}`);

    // Step 1: Get all user stories to identify files to delete
    const userStories = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId));

    logger.debug(`[Account Deletion] Found ${userStories.length} stories to delete`);

    // Step 2: Delete all files from Supabase Storage
    const filesToDelete: string[] = [];

    for (const story of userStories) {
      // Add audio files
      if (story.audioUrl && !story.audioUrl.startsWith('http')) {
        filesToDelete.push(story.audioUrl);
      }

      // Add photo files
      if (story.photoUrl && !story.photoUrl.startsWith('http')) {
        filesToDelete.push(story.photoUrl);
      }

      // Add photos from photos array (stored in metadata)
      if (story.photos && Array.isArray(story.photos)) {
        for (const photo of story.photos) {
          if (photo.url && !photo.url.startsWith('http')) {
            filesToDelete.push(photo.url);
          }
        }
      }
    }

    // Delete all files from storage
    if (filesToDelete.length > 0) {
      logger.debug(`[Account Deletion] Deleting ${filesToDelete.length} files from storage`);

      const { data: deletedFiles, error: storageError } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .remove(filesToDelete);

      if (storageError) {
        logger.error("[Account Deletion] Storage deletion error:", storageError);
        // Continue with deletion even if some files fail
      } else {
        logger.debug(`[Account Deletion] Deleted ${deletedFiles?.length || 0} files from storage`);
      }
    }

    // Also delete the entire user folder to catch any orphaned files
    const userFolderPaths = [
      `audio/${userId}`,
      `photo/${userId}`,
    ];

    for (const folderPath of userFolderPaths) {
      try {
        const { data: folderFiles } = await supabaseAdmin.storage
          .from("heritage-whisper-files")
          .list(folderPath);

        if (folderFiles && folderFiles.length > 0) {
          const folderFilePaths = folderFiles.map(file => `${folderPath}/${file.name}`);
          await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .remove(folderFilePaths);

          logger.debug(`[Account Deletion] Cleaned up ${folderFilePaths.length} files from ${folderPath}`);
        }
      } catch (error) {
        logger.error(`[Account Deletion] Error cleaning folder ${folderPath}:`, error);
        // Continue with deletion
      }
    }

    // Step 3: Delete all database records (cascade will handle related records)
    // Delete in order to avoid foreign key constraints

    // Delete family activity
    await db.delete(familyActivity).where(eq(familyActivity.userId, userId));
    logger.debug("[Account Deletion] Deleted family activity records");

    // Delete family members
    await db.delete(familyMembers).where(eq(familyMembers.userId, userId));
    logger.debug("[Account Deletion] Deleted family member records");

    // Delete shared access (both owned and shared with)
    await db.delete(sharedAccess).where(eq(sharedAccess.ownerUserId, userId));
    await db.delete(sharedAccess).where(eq(sharedAccess.sharedWithUserId, userId));
    logger.debug("[Account Deletion] Deleted shared access records");

    // Delete user agreements
    await db.delete(userAgreements).where(eq(userAgreements.userId, userId));
    logger.debug("[Account Deletion] Deleted user agreement records");

    // Delete stories (this should cascade to follow_ups via DB constraints)
    await db.delete(stories).where(eq(stories.userId, userId));
    logger.debug("[Account Deletion] Deleted story records");

    // Step 4: Delete user from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logger.error("[Account Deletion] Auth user deletion error:", authDeleteError);
      // Continue anyway - we'll clean up the public.users record
    } else {
      logger.debug("[Account Deletion] Deleted user from Supabase Auth");
    }

    // Step 5: Delete user record from public.users
    await db.delete(users).where(eq(users.id, userId));
    logger.debug("[Account Deletion] Deleted user record from database");

    logger.debug(`[Account Deletion] Successfully completed deletion for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Account and all associated data have been permanently deleted",
    });
  } catch (error) {
    logger.error("[Account Deletion] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
