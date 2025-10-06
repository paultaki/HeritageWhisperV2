import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { stories, users, userAgreements, sharedAccess, familyMembers } from "@/shared/schema";
import { eq } from "drizzle-orm";

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
 * GET /api/user/export
 * Export all user data in JSON format
 *
 * GDPR/CCPA Compliance: Right to data portability
 * Returns all personal data associated with the user account:
 * - User profile information
 * - All stories (with transcriptions and metadata)
 * - User agreements history
 * - Shared access records
 * - Family member connections
 */
export async function GET(request: NextRequest) {
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
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    console.log(`[Data Export] Starting export for user: ${userId}`);

    // Fetch all user data
    const [
      userRecord,
      userStories,
      userAgreementsRecords,
      sharedAccessRecords,
      familyMembersRecords,
    ] = await Promise.all([
      // User profile
      db.select().from(users).where(eq(users.id, userId)).then(res => res[0]),

      // Stories
      db.select().from(stories).where(eq(stories.userId, userId)),

      // Agreements
      db.select().from(userAgreements).where(eq(userAgreements.userId, userId)),

      // Shared access (both as owner and recipient)
      Promise.all([
        db.select().from(sharedAccess).where(eq(sharedAccess.ownerUserId, userId)),
        db.select().from(sharedAccess).where(eq(sharedAccess.sharedWithUserId, userId)),
      ]).then(([owned, received]) => ({ owned, received })),

      // Family members
      db.select().from(familyMembers).where(eq(familyMembers.userId, userId)),
    ]);

    // Build export data package
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",

      // User Profile
      profile: {
        id: userRecord?.id,
        email: userRecord?.email,
        name: userRecord?.name,
        birthYear: userRecord?.birthYear,
        bio: userRecord?.bio,
        profilePhotoUrl: userRecord?.profilePhotoUrl,
        createdAt: userRecord?.createdAt,
        isPaid: userRecord?.isPaid,
        storyCount: userRecord?.storyCount,
      },

      // Stories (sanitize URLs for privacy)
      stories: userStories.map((story) => ({
        id: story.id,
        title: story.title,
        transcription: story.transcription,
        storyYear: story.storyYear,
        storyDate: story.storyDate,
        lifeAge: story.lifeAge,
        durationSeconds: story.durationSeconds,
        emotions: story.emotions,
        pivotalCategory: story.pivotalCategory,
        includeInBook: story.includeInBook,
        includeInTimeline: story.includeInTimeline,
        isFavorite: story.isFavorite,
        wisdomClipText: story.wisdomClipText,
        wisdomClipDuration: story.wisdomClipDuration,
        formattedContent: story.formattedContent,
        extractedFacts: story.extractedFacts,
        photos: story.photos,
        createdAt: story.createdAt,
        // Note: File URLs are not included for security - use separate download
        hasAudio: !!story.audioUrl,
        hasPhoto: !!story.photoUrl,
        photoCount: Array.isArray(story.photos) ? story.photos.length : 0,
      })),

      // Legal agreements accepted
      agreements: userAgreementsRecords.map((agreement) => ({
        agreementType: agreement.agreementType,
        version: agreement.version,
        acceptedAt: agreement.acceptedAt,
        method: agreement.method,
        ipAddress: agreement.ipAddress,
      })),

      // Sharing activity
      sharing: {
        // Stories you've shared with others
        sharedByYou: sharedAccessRecords.owned.map((share) => ({
          sharedWithEmail: share.sharedWithEmail,
          permissionLevel: share.permissionLevel,
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          isActive: share.isActive,
          lastAccessedAt: share.lastAccessedAt,
        })),

        // Stories shared with you
        sharedWithYou: sharedAccessRecords.received.map((share) => ({
          permissionLevel: share.permissionLevel,
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          isActive: share.isActive,
          lastAccessedAt: share.lastAccessedAt,
        })),
      },

      // Family connections
      family: familyMembersRecords.map((member) => ({
        email: member.email,
        name: member.name,
        relationship: member.relationship,
        status: member.status,
        invitedAt: member.invitedAt,
        acceptedAt: member.acceptedAt,
        permissions: member.permissions,
      })),

      // Statistics
      statistics: {
        totalStories: userStories.length,
        totalRecordingMinutes: Math.round(
          userStories.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60
        ),
        storiesWithPhotos: userStories.filter(s => s.photoUrl || (Array.isArray(s.photos) && s.photos.length > 0)).length,
        storiesWithAudio: userStories.filter(s => s.audioUrl).length,
        oldestStoryYear: Math.min(...userStories.map(s => s.storyYear || 9999)),
        newestStoryYear: Math.max(...userStories.map(s => s.storyYear || 0)),
        familyMembersCount: familyMembersRecords.length,
        sharedStoriesCount: sharedAccessRecords.owned.length,
      },

      // Export metadata
      dataPolicy: {
        description: "This export contains all personal data associated with your HeritageWhisper account.",
        fileUrls: "Audio and photo files can be downloaded separately from your timeline.",
        format: "JSON",
        gdprCompliant: true,
        dataRetention: "Data is retained until account deletion or upon request.",
      },
    };

    console.log(`[Data Export] Export completed for user: ${userId}`);
    console.log(`[Data Export] Exported ${userStories.length} stories, ${userAgreementsRecords.length} agreements`);

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="heritagewhisper-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("[Data Export] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to export data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
