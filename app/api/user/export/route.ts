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

    // Fetch all user data (comprehensive GDPR export using Supabase client)
    const [
      { data: userRecord },
      { data: userStories },
      { data: userAgreementsRecords },
      { data: sharedAccessOwned },
      { data: sharedAccessReceived },
      { data: familyMembersRecords },
      { data: familyActivityRecords },
      { data: familyPromptsRecords },
      { data: activePromptsRecords },
      { data: promptHistoryRecords },
      { data: userPromptsRecords },
      { data: ghostPromptsRecords },
      { data: historicalContextRecords },
      { data: profilesRecords },
      { data: passkeysRecords },
    ] = await Promise.all([
      // User profile
      supabaseAdmin.from('users').select('*').eq('id', userId).single(),

      // Stories
      supabaseAdmin.from('stories').select('*').eq('user_id', userId),

      // User agreements
      supabaseAdmin.from('user_agreements').select('*').eq('user_id', userId),

      // Shared access (owned)
      supabaseAdmin.from('shared_access').select('*').eq('owner_user_id', userId),

      // Shared access (received)
      supabaseAdmin.from('shared_access').select('*').eq('shared_with_user_id', userId),

      // Family members
      supabaseAdmin.from('family_members').select('*').eq('user_id', userId),

      // Family activity
      supabaseAdmin.from('family_activity').select('*').eq('user_id', userId),

      // Family prompts (may not exist yet)
      supabaseAdmin.from('family_prompts').select('*').eq('storyteller_user_id', userId),

      // Active prompts (AI-generated)
      supabaseAdmin.from('active_prompts').select('*').eq('user_id', userId),

      // Prompt history (archive)
      supabaseAdmin.from('prompt_history').select('*').eq('user_id', userId),

      // User prompts catalog
      supabaseAdmin.from('user_prompts').select('*').eq('user_id', userId),

      // Ghost prompts
      supabaseAdmin.from('ghost_prompts').select('*').eq('user_id', userId),

      // Historical context (personalization)
      supabaseAdmin.from('historical_context').select('*').eq('user_id', userId),

      // Profiles (personalization)
      supabaseAdmin.from('profiles').select('*').eq('user_id', userId),

      // Passkeys (WebAuthn) - may not exist yet
      supabaseAdmin.from('passkeys').select('*').eq('user_id', userId),
    ]);

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

      // Stories (sanitize URLs for privacy)
      stories: (userStories || []).map((story: any) => ({
        id: story.id,
        title: story.title,
        transcription: story.transcription,
        storyYear: story.story_year,
        storyDate: story.story_date,
        lifeAge: story.life_age,
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
        photos: story.photos,
        createdAt: story.created_at,
        // Note: File URLs are not included for security - use separate download
        hasAudio: !!story.audio_url,
        hasPhoto: !!story.photo_url,
        photoCount: Array.isArray(story.photos) ? story.photos.length : 0,
      })),

      // AI-Generated Prompts (active, expired, and history)
      prompts: {
        active: (activePromptsRecords || []).map((prompt: any) => ({
          id: prompt.id,
          promptText: prompt.prompt_text,
          tier: prompt.tier,
          source: prompt.source,
          expiresAt: prompt.expires_at,
          createdAt: prompt.created_at,
        })),
        history: (promptHistoryRecords || []).map((prompt: any) => ({
          id: prompt.id,
          promptText: prompt.prompt_text,
          tier: prompt.tier,
          source: prompt.source,
          answeredStoryId: prompt.answered_story_id,
          answeredAt: prompt.answered_at,
          skippedAt: prompt.skipped_at,
          archivedAt: prompt.archived_at,
        })),
        catalog: (userPromptsRecords || []).map((prompt: any) => ({
          id: prompt.id,
          promptText: prompt.prompt_text,
          category: prompt.category,
          isActive: prompt.is_active,
          timesUsed: prompt.times_used,
        })),
        ghost: (ghostPromptsRecords || []).map((prompt: any) => ({
          id: prompt.id,
          promptText: prompt.prompt_text,
          category: prompt.category,
          usedAt: prompt.used_at,
        })),
      },

      // Personalization Data
      personalization: {
        profiles: (profilesRecords || []).map((profile: any) => ({
          id: profile.id,
          profileType: profile.profile_type,
          profileData: profile.profile_data,
          confidenceScore: profile.confidence_score,
          lastUpdated: profile.last_updated,
        })),
        historicalContext: (historicalContextRecords || []).map((context: any) => ({
          id: context.id,
          contextType: context.context_type,
          contextData: context.context_data,
          relevanceScore: context.relevance_score,
          createdAt: context.created_at,
        })),
      },

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
        sharedStoriesCount: (sharedAccessOwned || []).length,
        activePromptsCount: (activePromptsRecords || []).length,
        answeredPromptsCount: (promptHistoryRecords || []).filter((p: any) => p.answered_at).length,
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
