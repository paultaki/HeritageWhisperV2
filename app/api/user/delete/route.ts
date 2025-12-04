import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { stories } from "@/shared/schema";
import { eq } from "drizzle-orm";

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
 *
 * Performance: Uses batch deletes and parallel operations where safe
 */
export async function DELETE(request: NextRequest) {
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

    logger.debug(
      `[Account Deletion] Starting deletion process for user: ${userId}`,
    );

    // Step 1: Get all user stories to identify files to delete
    const userStories = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId));

    logger.debug(
      `[Account Deletion] Found ${userStories.length} stories to delete`,
    );

    // Step 2: Collect all file paths (fast in-memory operation)
    const filesToDelete: string[] = [];

    for (const story of userStories) {
      // Add audio files
      if (story.audioUrl && !story.audioUrl.startsWith("http")) {
        filesToDelete.push(story.audioUrl);
      }

      // Add photo files
      if (story.photoUrl && !story.photoUrl.startsWith("http")) {
        filesToDelete.push(story.photoUrl);
      }

      // Add photos from photos array (stored in metadata)
      if (story.photos && Array.isArray(story.photos)) {
        for (const photo of story.photos) {
          if (photo.url && !photo.url.startsWith("http")) {
            filesToDelete.push(photo.url);
          }
        }
      }
    }

    // Step 3: Delete files from storage (batch operation)
    if (filesToDelete.length > 0) {
      logger.debug(
        `[Account Deletion] Deleting ${filesToDelete.length} files from storage`,
      );

      const { data: deletedFiles, error: storageError } =
        await supabaseAdmin.storage
          .from("heritage-whisper-files")
          .remove(filesToDelete);

      if (storageError) {
        logger.error(
          "[Account Deletion] Storage deletion error:",
          storageError,
        );
        // Continue with deletion even if some files fail
      } else {
        logger.debug(
          `[Account Deletion] Deleted ${deletedFiles?.length || 0} files from storage`,
        );
      }
    }

    // Step 4: Clean up user folders in parallel
    const userFolderPaths = [`audio/${userId}`, `photo/${userId}`];

    await Promise.all(
      userFolderPaths.map(async (folderPath) => {
        try {
          const { data: folderFiles } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .list(folderPath);

          if (folderFiles && folderFiles.length > 0) {
            const folderFilePaths = folderFiles.map(
              (file) => `${folderPath}/${file.name}`,
            );
            await supabaseAdmin.storage
              .from("heritage-whisper-files")
              .remove(folderFilePaths);

            logger.debug(
              `[Account Deletion] Cleaned up ${folderFilePaths.length} files from ${folderPath}`,
            );
          }
        } catch (error) {
          logger.error(
            `[Account Deletion] Error cleaning folder ${folderPath}:`,
            error,
          );
          // Continue with deletion
        }
      }),
    );

    // Step 5: Delete database records
    // Group 1: Independent tables (can be deleted in parallel)
    logger.debug("[Account Deletion] Deleting independent records in parallel...");

    // Helper to safely delete from tables that may not exist
    const safeDelete = async (table: string, column: string) => {
      try {
        await supabaseAdmin.from(table).delete().eq(column, userId);
      } catch {
        // Table may not exist, continue silently
      }
    };

    await Promise.all([
      supabaseAdmin.from('family_activity').delete().eq('user_id', userId),
      safeDelete('family_prompts', 'storyteller_user_id'),
      supabaseAdmin.from('family_members').delete().eq('user_id', userId),
      supabaseAdmin.from('shared_access').delete().eq('owner_user_id', userId),
      supabaseAdmin.from('shared_access').delete().eq('shared_with_user_id', userId),
      supabaseAdmin.from('user_agreements').delete().eq('user_id', userId),
      supabaseAdmin.from('ai_usage_log').delete().eq('user_id', userId),
      supabaseAdmin.from('historical_context').delete().eq('user_id', userId),
      supabaseAdmin.from('profiles').delete().eq('user_id', userId),
      safeDelete('passkeys', 'user_id'),
    ]);

    logger.debug("[Account Deletion] Deleted independent records");

    // Group 2: Prompt-related tables (can be deleted in parallel)
    await Promise.all([
      supabaseAdmin.from('active_prompts').delete().eq('user_id', userId),
      supabaseAdmin.from('prompt_history').delete().eq('user_id', userId),
      supabaseAdmin.from('user_prompts').delete().eq('user_id', userId),
      supabaseAdmin.from('ghost_prompts').delete().eq('user_id', userId),
    ]);

    logger.debug("[Account Deletion] Deleted prompt records");

    // Group 3: Stories (depends on prompts being deleted first due to potential FKs)
    await supabaseAdmin.from('stories').delete().eq('user_id', userId);
    logger.debug("[Account Deletion] Deleted story records");

    // Step 6: Delete user from Supabase Auth
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logger.error(
        "[Account Deletion] Auth user deletion error:",
        authDeleteError,
      );
      // Continue anyway - we'll clean up the public.users record
    } else {
      logger.debug("[Account Deletion] Deleted user from Supabase Auth");
    }

    // Step 7: Delete user record from public.users (must be last)
    await supabaseAdmin.from('users').delete().eq('id', userId);
    logger.debug("[Account Deletion] Deleted user record from database");

    logger.debug(
      `[Account Deletion] Successfully completed deletion for user: ${userId}`,
    );

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
      { status: 500 },
    );
  }
}
