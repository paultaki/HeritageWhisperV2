import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    // Fetch all user data (GDPR Article 20: Only data "provided by" user, not AI work product)
    const [
      { data: userRecord },
      { data: userStories },
      { data: userAgreementsRecords },
      { data: sharedAccessOwned },
      { data: sharedAccessReceived },
      { data: familyMembersRecords },
      { data: familyActivityRecords },
      { data: familyPromptsRecords },
      { data: userPromptsRecords },
      { data: passkeysRecords },
    ] = await Promise.all([
      // User profile
      supabaseAdmin.from('users').select('*').eq('id', userId).single(),

      // Stories (user-created content)
      supabaseAdmin.from('stories').select('*').eq('user_id', userId),

      // User agreements (user accepted)
      supabaseAdmin.from('user_agreements').select('*').eq('user_id', userId),

      // Shared access (owned)
      supabaseAdmin.from('shared_access').select('*').eq('owner_user_id', userId),

      // Shared access (received)
      supabaseAdmin.from('shared_access').select('*').eq('shared_with_user_id', userId),

      // Family members (user invited)
      supabaseAdmin.from('family_members').select('*').eq('user_id', userId),

      // Family activity (user's family interactions)
      supabaseAdmin.from('family_activity').select('*').eq('user_id', userId),

      // Family prompts (questions from family - USER DATA)
      supabaseAdmin.from('family_prompts').select('*').eq('storyteller_user_id', userId),

      // User prompts catalog (user saved/queued - USER DATA)
      supabaseAdmin.from('user_prompts').select('*').eq('user_id', userId),

      // Passkeys (WebAuthn - user created)
      supabaseAdmin.from('passkeys').select('*').eq('user_id', userId),
    ]);

    // Debug logging
    logger.debug(`[Data Export] Fetched data counts:`, {
      userRecord: userRecord ? 'found' : 'null',
      stories: (userStories || []).length,
      agreements: (userAgreementsRecords || []).length,
      familyMembers: (familyMembersRecords || []).length,
      savedPrompts: (userPromptsRecords || []).length,
    });

    // Debug: Check first story structure
    if (userStories && userStories.length > 0) {
      logger.debug(`[Data Export] First story sample:`, {
        id: userStories[0].id,
        title: userStories[0].title,
        hasTranscription: !!userStories[0].transcription,
        transcriptionLength: userStories[0].transcription?.length || 0,
        hasAudioUrl: !!userStories[0].audio_url,
        allKeys: Object.keys(userStories[0]),
      });
    }

    // Build export data package
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "2.0",

      // User Profile
      profile: userRecord ? {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        birthYear: userRecord.birth_year,
        bio: userRecord.bio,
        profilePhotoUrl: userRecord.profile_photo_url,
        createdAt: userRecord.created_at,
        isPaid: userRecord.is_paid,
        storyCount: userRecord.story_count,
      } : null,

      // Stories (user-created content with full data)
      stories: (userStories || []).map((story: any) => ({
        id: story.id,
        title: story.title,
        transcription: story.transcription,
        lessonLearned: story.lesson_learned,
        lessonAlternatives: story.lesson_alternatives,
        storyYear: story.story_year,
        storyDate: story.story_date,
        lifeAge: story.life_age,
        lifePhase: story.life_phase,
        durationSeconds: story.duration_seconds,
        emotions: story.emotions,
        pivotalCategory: story.pivotal_category,
        includeInBook: story.include_in_book,
        includeInTimeline: story.include_in_timeline,
        isFavorite: story.is_favorite,
        wisdomClipText: story.wisdom_clip_text,
        wisdomClipDuration: story.wisdom_clip_duration,
        formattedContent: story.formatted_content,
        extractedFacts: story.extracted_facts,
        entitiesExtracted: story.entities_extracted,
        audioUrl: story.audio_url,
        wisdomClipUrl: story.wisdom_clip_url,
        photoUrl: story.photo_url,
        photoTransform: story.photo_transform,
        photos: story.photos,
        createdAt: story.created_at,
      })),

      // User-saved prompts (from catalog - user chose these)
      savedPrompts: (userPromptsRecords || []).map((prompt: any) => ({
        id: prompt.id,
        text: prompt.text,
        category: prompt.category,
        source: prompt.source,
        status: prompt.status,
        queuePosition: prompt.queue_position,
        createdAt: prompt.created_at,
      })),

      // Legal agreements accepted (mask IP addresses per GDPR Recital 26)
      agreements: (userAgreementsRecords || []).map((agreement: any) => ({
        agreementType: agreement.agreement_type,
        version: agreement.version,
        acceptedAt: agreement.accepted_at,
        method: agreement.method,
        ipAddress: maskIp(agreement.ip_address),
      })),

      // Sharing activity
      sharing: {
        // Stories you've shared with others (mask third-party emails)
        sharedByYou: (sharedAccessOwned || []).map((share: any) => ({
          sharedWithEmail: maskEmail(share.shared_with_email),
          permissionLevel: share.permission_level,
          createdAt: share.created_at,
          expiresAt: share.expires_at,
          isActive: share.is_active,
          lastAccessedAt: share.last_accessed_at,
        })),

        // Stories shared with you
        sharedWithYou: (sharedAccessReceived || []).map((share: any) => ({
          permissionLevel: share.permission_level,
          createdAt: share.created_at,
          expiresAt: share.expires_at,
          isActive: share.is_active,
          lastAccessedAt: share.last_accessed_at,
        })),
      },

      // Family connections (mask third-party emails)
      family: {
        members: (familyMembersRecords || []).map((member: any) => ({
          email: maskEmail(member.email),
          name: member.name,
          relationship: member.relationship,
          status: member.status,
          invitedAt: member.invited_at,
          acceptedAt: member.accepted_at,
          permissions: member.permissions,
        })),
        activity: (familyActivityRecords || []).map((activity: any) => ({
          activityType: activity.activity_type,
          activityData: activity.activity_data,
          createdAt: activity.created_at,
        })),
        prompts: (familyPromptsRecords || []).map((prompt: any) => ({
          promptText: prompt.prompt_text,
          context: prompt.context,
          status: prompt.status,
          answeredStoryId: prompt.answered_story_id,
          answeredAt: prompt.answered_at,
          createdAt: prompt.created_at,
        })),
      },

      // Security credentials (passkeys/WebAuthn)
      security: {
        passkeys: (passkeysRecords || []).map((passkey: any) => ({
          id: passkey.id,
          credentialId: maskToken(passkey.credential_id),
          friendlyName: passkey.friendly_name,
          credentialBackedUp: passkey.credential_backed_up,
          credentialDeviceType: passkey.credential_device_type,
          transports: passkey.transports,
          signCount: passkey.sign_count,
          createdAt: passkey.created_at,
          lastUsedAt: passkey.last_used_at,
          // Note: Public key excluded for security
        })),
      },

      // Statistics
      statistics: {
        totalStories: (userStories || []).length,
        totalRecordingMinutes: Math.round(
          (userStories || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60,
        ),
        storiesWithPhotos: (userStories || []).filter(
          (s: any) => s.photo_url || (Array.isArray(s.photos) && s.photos.length > 0),
        ).length,
        storiesWithAudio: (userStories || []).filter((s: any) => s.audio_url).length,
        oldestStoryYear: Math.min(
          ...(userStories || []).map((s: any) => s.story_year || 9999),
        ),
        newestStoryYear: Math.max(...(userStories || []).map((s: any) => s.story_year || 0)),
        familyMembersCount: (familyMembersRecords || []).length,
        familyPromptsCount: (familyPromptsRecords || []).length,
        savedPromptsCount: (userPromptsRecords || []).length,
        sharedStoriesCount: (sharedAccessOwned || []).length,
        passkeysCount: (passkeysRecords || []).length,
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
            "All stories with transcriptions, lessons, and full metadata",
            "Audio and photo file URLs for download",
            "User-saved prompts from catalog",
            "Family-submitted questions and activity",
            "Family connections and sharing activity",
            "Legal agreements and consent records",
            "Security credentials (passkeys)",
            "Usage statistics",
          ],
          excluded: [
            "AI-generated prompts (not user-provided data)",
            "AI-derived personalization profiles (work product)",
            "Historical context (AI-generated)",
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
      `[Data Export] Exported ${(userStories || []).length} stories, ${(userAgreementsRecords || []).length} agreements`,
    );

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="heritagewhisper-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error: any) {
    logger.error(`[Data Export] Error: ${error.message}`, error);
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 },
    );
  }
}
