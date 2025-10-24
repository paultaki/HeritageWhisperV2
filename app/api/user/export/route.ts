import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import {
  stories,
  users,
  userAgreements,
  sharedAccess,
  familyMembers,
  familyActivity,
  activePrompts,
  promptHistory,
  userPrompts,
  ghostPrompts,
  historicalContext,
  profiles,
  passkeys,
} from "@/shared/schema";
import { eq, sql } from "drizzle-orm";
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
        { status: 401 },
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
        { status: 401 },
      );
    }

    const userId = authUser.id;

    logger.debug(`[Data Export] Starting GDPR-compliant export for user: ${userId}`);

    // Helper function to mask tokens (security)
    const maskToken = (token: string | null) => {
      if (!token) return null;
      return `${token.slice(0, 4)}…`;
    };

    // Helper function to mask IP addresses (GDPR)
    const maskIp = (ip: string | null) => {
      if (!ip) return null;
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `xxx.xxx.xxx.${parts[3]}`;
      }
      return 'xxx.xxx.xxx.xxx';
    };

    // Helper function to mask emails (protect third-party privacy)
    const maskEmail = (email: string | null) => {
      if (!email) return null;
      const [local, domain] = email.split('@');
      if (!local || !domain) return email;
      return `${local[0]}***@${domain}`;
    };

    // Check if passkeys table exists (conditional - early implementation)
    const { rows: passkeyCheck } = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'passkeys'
      )
    `);
    const passkeysTableExists = passkeyCheck[0]?.exists ?? false;

    // Check if family_prompts table exists (conditional - early implementation)
    const { rows: familyPromptsCheck } = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'family_prompts'
      )
    `);
    const familyPromptsTableExists = familyPromptsCheck[0]?.exists ?? false;

    // Fetch all user data (comprehensive GDPR export)
    const [
      userRecord,
      userStories,
      userAgreementsRecords,
      sharedAccessRecords,
      familyMembersRecords,
      familyActivityRecords,
      familyPromptsRecords,
      activePromptsRecords,
      promptHistoryRecords,
      userPromptsRecords,
      ghostPromptsRecords,
      historicalContextRecords,
      profilesRecords,
      passkeysRecords,
    ] = await Promise.all([
      // User profile
      db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]),

      // Stories
      db.select().from(stories).where(eq(stories.userId, userId)),

      // Agreements
      db.select().from(userAgreements).where(eq(userAgreements.userId, userId)),

      // Shared access (both as owner and recipient)
      Promise.all([
        db
          .select()
          .from(sharedAccess)
          .where(eq(sharedAccess.ownerUserId, userId)),
        db
          .select()
          .from(sharedAccess)
          .where(eq(sharedAccess.sharedWithUserId, userId)),
      ]).then(([owned, received]) => ({ owned, received })),

      // Family members
      db.select().from(familyMembers).where(eq(familyMembers.userId, userId)),

      // Family activity
      db.select().from(familyActivity).where(eq(familyActivity.userId, userId)),

      // Family prompts (conditional)
      familyPromptsTableExists
        ? db.execute(sql`
            SELECT * FROM family_prompts
            WHERE storyteller_user_id = ${userId}
          `)
        : Promise.resolve({ rows: [] }),

      // Active prompts (AI-generated)
      db.select().from(activePrompts).where(eq(activePrompts.userId, userId)),

      // Prompt history (archive)
      db.select().from(promptHistory).where(eq(promptHistory.userId, userId)),

      // User prompts (catalog)
      db.select().from(userPrompts).where(eq(userPrompts.userId, userId)),

      // Ghost prompts (legacy)
      db.select().from(ghostPrompts).where(eq(ghostPrompts.userId, userId)),

      // Historical context
      db.select().from(historicalContext).where(eq(historicalContext.userId, userId)),

      // Profiles
      db.select().from(profiles).where(eq(profiles.userId, userId)),

      // Passkeys (conditional)
      passkeysTableExists
        ? db.select().from(passkeys).where(eq(passkeys.userId, userId))
        : Promise.resolve([]),
    ]);

    // Build export data package
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "2.0",

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

      // AI-Generated Prompts (active, expired, and history)
      prompts: {
        active: activePromptsRecords.map((prompt) => ({
          id: prompt.id,
          promptText: prompt.promptText,
          tier: prompt.tier,
          source: prompt.source,
          expiresAt: prompt.expiresAt,
          createdAt: prompt.createdAt,
        })),
        history: promptHistoryRecords.map((prompt) => ({
          id: prompt.id,
          promptText: prompt.promptText,
          tier: prompt.tier,
          source: prompt.source,
          answeredStoryId: prompt.answeredStoryId,
          answeredAt: prompt.answeredAt,
          skippedAt: prompt.skippedAt,
          archivedAt: prompt.archivedAt,
        })),
        catalog: userPromptsRecords.map((prompt) => ({
          id: prompt.id,
          promptText: prompt.promptText,
          category: prompt.category,
          isActive: prompt.isActive,
          timesUsed: prompt.timesUsed,
        })),
        ghost: ghostPromptsRecords.map((prompt) => ({
          id: prompt.id,
          promptText: prompt.promptText,
          category: prompt.category,
          usedAt: prompt.usedAt,
        })),
      },

      // Personalization Data
      personalization: {
        profiles: profilesRecords.map((profile) => ({
          id: profile.id,
          profileType: profile.profileType,
          profileData: profile.profileData,
          confidenceScore: profile.confidenceScore,
          lastUpdated: profile.lastUpdated,
        })),
        historicalContext: historicalContextRecords.map((context) => ({
          id: context.id,
          contextType: context.contextType,
          contextData: context.contextData,
          relevanceScore: context.relevanceScore,
          createdAt: context.createdAt,
        })),
      },

      // Legal agreements accepted (mask IP addresses per GDPR Recital 26)
      agreements: userAgreementsRecords.map((agreement) => ({
        agreementType: agreement.agreementType,
        version: agreement.version,
        acceptedAt: agreement.acceptedAt,
        method: agreement.method,
        ipAddress: maskIp(agreement.ipAddress),
      })),

      // Sharing activity
      sharing: {
        // Stories you've shared with others (mask third-party emails)
        sharedByYou: sharedAccessRecords.owned.map((share) => ({
          sharedWithEmail: maskEmail(share.sharedWithEmail),
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

      // Family connections (mask third-party emails)
      family: {
        members: familyMembersRecords.map((member) => ({
          email: maskEmail(member.email),
          name: member.name,
          relationship: member.relationship,
          status: member.status,
          invitedAt: member.invitedAt,
          acceptedAt: member.acceptedAt,
          permissions: member.permissions,
        })),
        activity: familyActivityRecords.map((activity) => ({
          activityType: activity.activityType,
          activityData: activity.activityData,
          createdAt: activity.createdAt,
        })),
        prompts: Array.isArray(familyPromptsRecords)
          ? familyPromptsRecords.map((prompt: any) => ({
              promptText: prompt.prompt_text,
              context: prompt.context,
              status: prompt.status,
              answeredStoryId: prompt.answered_story_id,
              answeredAt: prompt.answered_at,
              createdAt: prompt.created_at,
            }))
          : (familyPromptsRecords as any).rows?.map((prompt: any) => ({
              promptText: prompt.prompt_text,
              context: prompt.context,
              status: prompt.status,
              answeredStoryId: prompt.answered_story_id,
              answeredAt: prompt.answered_at,
              createdAt: prompt.created_at,
            })) || [],
      },

      // Security credentials (passkeys/WebAuthn)
      security: {
        passkeys: passkeysRecords.map((passkey) => ({
          id: passkey.id,
          credentialId: maskToken(passkey.credentialId),
          friendlyName: passkey.friendlyName,
          credentialBackedUp: passkey.credentialBackedUp,
          credentialDeviceType: passkey.credentialDeviceType,
          transports: passkey.transports,
          signCount: passkey.signCount,
          createdAt: passkey.createdAt,
          lastUsedAt: passkey.lastUsedAt,
          // Note: Public key excluded for security
        })),
      },

      // Statistics
      statistics: {
        totalStories: userStories.length,
        totalRecordingMinutes: Math.round(
          userStories.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) /
            60,
        ),
        storiesWithPhotos: userStories.filter(
          (s) => s.photoUrl || (Array.isArray(s.photos) && s.photos.length > 0),
        ).length,
        storiesWithAudio: userStories.filter((s) => s.audioUrl).length,
        oldestStoryYear: Math.min(
          ...userStories.map((s) => s.storyYear || 9999),
        ),
        newestStoryYear: Math.max(...userStories.map((s) => s.storyYear || 0)),
        familyMembersCount: familyMembersRecords.length,
        familyPromptsCount: Array.isArray(familyPromptsRecords)
          ? familyPromptsRecords.length
          : (familyPromptsRecords as any).rows?.length || 0,
        sharedStoriesCount: sharedAccessRecords.owned.length,
        activePromptsCount: activePromptsRecords.length,
        answeredPromptsCount: promptHistoryRecords.filter((p) => p.answeredAt)
          .length,
        passkeysCount: passkeysRecords.length,
      },

      // About this export (GDPR compliance metadata)
      aboutThisExport: {
        legalBasis: "GDPR Article 20 (Right to Data Portability)",
        dataController: "HeritageWhisper LLC",
        purpose:
          "This export contains all personal data associated with your HeritageWhisper account in a structured, commonly used, and machine-readable format (JSON).",
        scope: {
          included: [
            "User profile and account information",
            "All stories with transcriptions and metadata",
            "AI-generated prompts and personalization data",
            "Family connections, sharing activity, and submitted questions",
            "Legal agreements and consent records",
            "Security credentials (passkeys)",
            "Usage statistics",
          ],
          excluded: [
            "Audio and photo files (download separately from your timeline)",
            "System logs older than 90 days",
            "Encrypted authentication tokens (public keys only)",
            "Third-party email addresses (masked for privacy protection)",
            "IP addresses (anonymized per GDPR Recital 26)",
          ],
        },
        dataMasking: {
          ipAddresses: "Last octet preserved, first three anonymized (xxx.xxx.xxx.123)",
          thirdPartyEmails: "First character + domain preserved (a***@example.com)",
          authTokens: "First 4 characters + ellipsis (abcd…)",
        },
        format: "JSON",
        encoding: "UTF-8",
        retention: {
          userDataRetention:
            "Your data is retained until account deletion or upon written request",
          backupRetention: "30 days in encrypted backups",
          logRetention: "90 days for security and debugging",
        },
        rights: {
          access: "Request a copy of your data at any time (this export)",
          rectification: "Update your profile and stories via the application",
          erasure: 'Delete your account via Profile Settings → "Delete Account"',
          portability: "Download this export and transfer to another service",
          objection: "Object to processing via email to privacy@heritagewhisper.com",
        },
        contact: {
          dataProtection: "privacy@heritagewhisper.com",
          support: "support@heritagewhisper.com",
        },
        exportMetadata: {
          version: "2.0",
          generatedAt: new Date().toISOString(),
          userId: userId,
          requestedVia: "User-initiated export",
        },
      },
    };

    logger.debug(`[Data Export] Export completed for user: ${userId}`);
    logger.debug(
      `[Data Export] Exported ${userStories.length} stories, ${userAgreementsRecords.length} agreements`,
    );

    // Track data export
    try {
      await supabaseAdmin.rpc('increment_data_export', { user_id: userId });
    } catch (trackError) {
      // Don't fail the export if tracking fails
      logger.error("[Data Export] Failed to track export:", trackError);
    }

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="heritagewhisper-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error("[Data Export] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to export data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
