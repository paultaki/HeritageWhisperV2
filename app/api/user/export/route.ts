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

    // Check for bypass parameter (development only)
    const bypassRateLimit = request.nextUrl.searchParams.get('bypass_rate_limit') === 'true'
      && process.env.NODE_ENV === 'development';

    // Rate limiting: 1 export per 24 hours (GDPR compliance best practice)
    // Fetch current export data for rate limiting and update
    const { data: rateLimitCheck } = await supabaseAdmin
      .from('users')
      .select('last_data_export_at, data_exports_count')
      .eq('id', userId)
      .single();

    if (!bypassRateLimit && rateLimitCheck?.last_data_export_at) {
      const lastExport = new Date(rateLimitCheck.last_data_export_at);
      const now = new Date();
      const hoursSinceLastExport = (now.getTime() - lastExport.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastExport < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastExport);
        logger.warn(`[Data Export] Rate limit: User ${userId} must wait ${hoursRemaining} hours`);
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: `You can only export your data once every 24 hours. Please try again in ${hoursRemaining} hours.`,
            retry_after_hours: hoursRemaining,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(hoursRemaining * 3600), // seconds
            },
          },
        );
      }
    }

    if (bypassRateLimit) {
      logger.debug(`[Data Export] Rate limit bypassed (development mode)`);
    }

    // Update last export timestamp
    await supabaseAdmin
      .from('users')
      .update({
        last_data_export_at: new Date().toISOString(),
        data_exports_count: (rateLimitCheck?.data_exports_count || 0) + 1,
      })
      .eq('id', userId);

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

    // Fetch all user data (GDPR Article 20: User-provided + observed interaction data)
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
      // TIER 1: Required user interaction data
      { data: activePromptsRecords },
      { data: promptHistoryRecords },
      { data: profilesRecord },
      // TIER 2: Transparency data
      { data: historicalContextRecords },
      { data: aiUsageLogRecords },
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

      // TIER 1: Active prompts (AI-generated but shown to user)
      supabaseAdmin.from('active_prompts').select('*').eq('user_id', userId),

      // TIER 1: Prompt history (user interaction archive)
      supabaseAdmin.from('prompt_history').select('*').eq('user_id', userId),

      // TIER 1: User personality profile
      supabaseAdmin.from('profiles').select('*').eq('user_id', userId).single(),

      // TIER 2: Historical context (personalized AI facts)
      supabaseAdmin.from('historical_context').select('*').eq('user_id', userId),

      // TIER 2: AI usage (with cost/model masking below)
      supabaseAdmin.from('ai_usage_log').select('*').eq('user_id', userId),
    ]);

    // TIER 1: Fetch follow-ups separately (needs story IDs first)
    const storyIds = (userStories || []).map((s: any) => s.id).filter(Boolean);
    const { data: followUpsRecords } = storyIds.length > 0
      ? await supabaseAdmin.from('follow_ups').select('*').in('story_id', storyIds)
      : { data: [] };

    // TIER 2: Fetch Supabase Auth tables (separate calls required for auth schema)
    const [
      { data: authUserRecord },
      { data: authIdentitiesRecords },
      { data: authMfaFactorsRecords },
    ] = await Promise.all([
      // Auth user record
      supabaseAdmin.auth.admin.getUserById(userId),

      // OAuth identities
      supabaseAdmin.from('auth.identities').select('*').eq('user_id', userId),

      // MFA factors (NO secrets - only metadata)
      supabaseAdmin.from('auth.mfa_factors').select('id, friendly_name, factor_type, status, created_at, updated_at').eq('user_id', userId),
    ]);

    // Auth audit log (last 100 entries) - requires raw SQL
    const { data: authAuditLogRecords } = await supabaseAdmin
      .from('auth.audit_log_entries')
      .select('*')
      .eq('actor_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Debug logging
    logger.debug(`[Data Export] Fetched data counts:`, {
      userRecord: userRecord ? 'found' : 'null',
      stories: (userStories || []).length,
      agreements: (userAgreementsRecords || []).length,
      familyMembers: (familyMembersRecords || []).length,
      savedPrompts: (userPromptsRecords || []).length,
      activePrompts: (activePromptsRecords || []).length,
      promptHistory: (promptHistoryRecords || []).length,
      followUps: (followUpsRecords || []).length,
      authIdentities: (authIdentitiesRecords || []).length,
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

    // Build export data package (Version 3.0 - Enhanced GDPR compliance)
    const exportData = {
      // Export metadata
      export_metadata: {
        export: {
          exported_at: new Date().toISOString(),
          version: "3.0",
          controller: "HeritageWhisper LLC",
          contact: "privacy@heritagewhisper.com",
          dpo: "privacy@heritagewhisper.com",
        },
        data_processing: {
          purposes: [
            "Life story capture and preservation",
            "Book creation and PDF export",
            "Family sharing and collaboration",
            "AI-powered transcription and personalized prompts",
            "System security and fraud prevention",
          ],
          legal_bases: [
            "Contract (GDPR Art. 6(1)(b)) - service delivery",
            "Consent (Art. 6(1)(a)) - optional features (AI prompts, family sharing)",
            "Legitimate interest (Art. 6(1)(f)) - fraud prevention, security",
          ],
          categories: [
            "Identity (name, email, birth year)",
            "Content (stories, photos, audio recordings)",
            "Behavior (AI usage, family activity, prompt interactions)",
            "Technical (IP addresses, user agents, session data)",
            "Preferences (notification, privacy, personality settings)",
          ],
          recipients: [
            "Supabase (database & storage)",
            "OpenAI (AI prompts & Realtime API)",
            "AssemblyAI (transcription)",
            "Vercel (hosting)",
            "Resend (email notifications)",
            "PDFShift (PDF export)",
            "Stripe (payment processing)",
            "Upstash (rate limiting)",
          ],
          retention: {
            stories: "Until user deletion",
            prompts_active: "7 days (Tier 1) or until milestone (Tier 3)",
            prompts_archive: "Indefinite (prompt_history)",
            sessions: "30 days (family sessions, rolling expiry)",
            logs: "90 days (application & access logs, auto-purge)",
            backups: "30 days (encrypted, rolling retention)",
          },
          transfers: {
            location: "US and EU (Supabase multi-region)",
            safeguards: "Standard Contractual Clauses (SCCs) for all processors",
          },
        },
        rights: {
          access: "GDPR Art. 15 (this export)",
          portability: "Art. 20 (machine-readable JSON format)",
          erasure: "Art. 17 (via /api/user/delete endpoint)",
          rectification: "Art. 16 (via profile settings or contact DPO)",
          restriction: "Art. 18 (contact privacy@heritagewhisper.com)",
          objection: "Art. 21 (opt-out in notification settings)",
          complaint: "Lodge with your national Data Protection Authority",
          withdraw_consent: "Via account settings or privacy@heritagewhisper.com",
        },
        privacy_policy: "https://dev.heritagewhisper.com/privacy",
        terms_of_service: "https://dev.heritagewhisper.com/terms",
      },

      // User Profile
      user_profile: userRecord ? {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        birth_year: userRecord.birth_year,
        bio: userRecord.bio,
        profile_photo_url: userRecord.profile_photo_url,
        profile_interests: userRecord.profile_interests,
        do_not_ask: userRecord.do_not_ask,
        ai_processing_enabled: userRecord.ai_processing_enabled,
        ai_daily_budget_usd: userRecord.ai_daily_budget_usd,
        ai_monthly_budget_usd: userRecord.ai_monthly_budget_usd,
        created_at: userRecord.created_at,
        is_paid: userRecord.is_paid,
        story_count: userRecord.story_count,
        role: userRecord.role,
      } : null,

      // Personalization
      personalization: {
        profile: profilesRecord ? {
          birth_year: profilesRecord.birth_year,
          major_life_phases: profilesRecord.major_life_phases,
          work_ethic: profilesRecord.work_ethic,
          risk_tolerance: profilesRecord.risk_tolerance,
          family_orientation: profilesRecord.family_orientation,
          spirituality: profilesRecord.spirituality,
          preferred_style: profilesRecord.preferred_style,
          emotional_comfort: profilesRecord.emotional_comfort,
          detail_level: profilesRecord.detail_level,
          follow_up_frequency: profilesRecord.follow_up_frequency,
          created_at: profilesRecord.created_at,
        } : null,
        historical_context: (historicalContextRecords || []).map((ctx: any) => ({
          decade: ctx.decade,
          age_range: ctx.age_range,
          facts: ctx.facts,
          generated_at: ctx.generated_at,
        })),
      },

      // Stories (user-created content with full data)
      stories: (userStories || []).map((story: any) => ({
        id: story.id,
        title: story.title,
        transcript: story.transcript,
        lesson_learned: story.lesson_learned,
        lesson_alternatives: story.lesson_alternatives,
        story_year: story.story_year,
        story_date: story.story_date,
        life_age: story.life_age,
        life_phase: story.life_phase,
        duration_seconds: story.duration_seconds,
        emotions: story.emotions,
        pivotal_category: story.pivotal_category,
        include_in_book: story.include_in_book,
        include_in_timeline: story.include_in_timeline,
        is_favorite: story.is_favorite,
        wisdom_clip_text: story.wisdom_clip_text,
        wisdom_clip_duration: story.wisdom_clip_duration,
        formatted_content: story.formatted_content,
        extracted_facts: story.extracted_facts,
        entities_extracted: story.entities_extracted,
        audio_url: story.audio_url,
        wisdom_clip_url: story.wisdom_clip_url,
        photo_url: story.photo_url,
        photo_transform: story.photo_transform,
        photos: story.photos,
        created_at: story.created_at,
      })),

      // AI Prompts System
      prompts: {
        active: (activePromptsRecords || []).map((prompt: any) => ({
          // IP Protection: Remove internal scoring/classification metadata
          // Keep only user-facing data and interaction history
          id: prompt.id,
          prompt_text: prompt.prompt_text,
          user_status: prompt.user_status,
          queue_position: prompt.queue_position,
          shown_count: prompt.shown_count,
          created_at: prompt.created_at,
          // ❌ Removed: tier, memory_type, prompt_score, score_reason, anchor_entity, anchor_year, context_note
        })),
        history: (promptHistoryRecords || []).map((prompt: any) => ({
          // IP Protection: Remove internal scoring/classification metadata
          id: prompt.id,
          prompt_text: prompt.prompt_text,
          shown_count: prompt.shown_count,
          outcome: prompt.outcome,
          story_id: prompt.story_id,
          archived_at: prompt.archived_at,
          // ❌ Removed: tier, memory_type, prompt_score, anchor_entity, anchor_year
        })),
        catalog: (userPromptsRecords || []).map((prompt: any) => {
          // IP Protection: Mask catalog prompts to prevent competitors from stealing prompt library
          // GDPR Recital 63: Right to portability should not adversely affect trade secrets
          const isCatalogPrompt = prompt.source === 'catalog';

          return {
            id: prompt.id,
            // Mask catalog prompt text, keep AI-generated personalized prompts
            text: isCatalogPrompt
              ? "[Catalog prompt - removed for IP protection]"
              : prompt.text,
            // Remove source and category fields entirely (system architecture & classification)
            // Note: source & category fields excluded from export to protect competitive advantage
            status: prompt.status,
            queue_position: prompt.queue_position,
            created_at: prompt.created_at,
          };
        }),
      },

      // Follow-up questions
      follow_ups: (followUpsRecords || []).map((followUp: any) => ({
        id: followUp.id,
        story_id: followUp.story_id,
        question_text: followUp.question_text,
        question_type: followUp.question_type,
        was_answered: followUp.was_answered,
        created_at: followUp.created_at,
      })),

      // Family connections (mask third-party emails)
      family: {
        members: (familyMembersRecords || []).map((member: any) => ({
          email: maskEmail(member.email),
          name: member.name,
          relationship: member.relationship,
          status: member.status,
          invited_at: member.invited_at,
          accepted_at: member.accepted_at,
          permissions: member.permissions,
        })),
        activity: (familyActivityRecords || []).map((activity: any) => ({
          activity_type: activity.activity_type,
          activity_data: activity.activity_data,
          created_at: activity.created_at,
        })),
        prompts: (familyPromptsRecords || []).map((prompt: any) => ({
          prompt_text: prompt.prompt_text,
          context: prompt.context,
          status: prompt.status,
          answered_story_id: prompt.answered_story_id,
          answered_at: prompt.answered_at,
          created_at: prompt.created_at,
        })),
      },

      // Sharing activity
      sharing: {
        // Stories you've shared with others (mask third-party emails)
        shared_by_you: (sharedAccessOwned || []).map((share: any) => ({
          shared_with_email: maskEmail(share.shared_with_email),
          permission_level: share.permission_level,
          created_at: share.created_at,
          expires_at: share.expires_at,
          is_active: share.is_active,
          last_accessed_at: share.last_accessed_at,
        })),

        // Stories shared with you
        shared_with_you: (sharedAccessReceived || []).map((share: any) => ({
          permission_level: share.permission_level,
          created_at: share.created_at,
          expires_at: share.expires_at,
          is_active: share.is_active,
          last_accessed_at: share.last_accessed_at,
        })),
      },

      // Security credentials (passkeys/WebAuthn)
      security: {
        passkeys: (passkeysRecords || []).map((passkey: any) => ({
          id: passkey.id,
          credential_id: maskToken(passkey.credential_id),
          friendly_name: passkey.friendly_name,
          credential_backed_up: passkey.credential_backed_up,
          credential_device_type: passkey.credential_device_type,
          transports: passkey.transports,
          sign_count: passkey.sign_count,
          created_at: passkey.created_at,
          last_used_at: passkey.last_used_at,
          // Note: Public key excluded for security
        })),
      },

      // Legal agreements
      legal: {
        agreements: (userAgreementsRecords || []).map((agreement: any) => ({
          agreement_type: agreement.agreement_type,
          version: agreement.version,
          accepted_at: agreement.accepted_at,
          method: agreement.method,
          ip_address: maskIp(agreement.ip_address),
        })),
      },

      // Usage logs (IP protected - costs & model names masked)
      usage: {
        ai_logs: (aiUsageLogRecords || []).map((log: any) => ({
          id: log.id,
          operation: log.operation,
          model: "AI model", // MASKED: Protect competitive advantage
          tokens_used: log.tokens_used,
          cost_usd: null, // MASKED: Protect pricing strategy
          ip_address: maskIp(log.ip_address),
          created_at: log.created_at,
        })),
      },

      // Authentication data
      auth: {
        user: authUserRecord?.user ? {
          id: authUserRecord.user.id,
          email: authUserRecord.user.email,
          email_confirmed_at: authUserRecord.user.email_confirmed_at,
          created_at: authUserRecord.user.created_at,
          updated_at: authUserRecord.user.updated_at,
          last_sign_in_at: authUserRecord.user.last_sign_in_at,
        } : null,
        identities: (authIdentitiesRecords || []).map((identity: any) => ({
          id: identity.id,
          provider: identity.provider,
          email: identity.email,
          created_at: identity.created_at,
          last_sign_in_at: identity.last_sign_in_at,
        })),
        mfa_factors: (authMfaFactorsRecords || []).map((factor: any) => ({
          id: factor.id,
          friendly_name: factor.friendly_name,
          factor_type: factor.factor_type,
          status: factor.status,
          created_at: factor.created_at,
          updated_at: factor.updated_at,
          // Note: Secrets excluded for security
        })),
        audit_log: (authAuditLogRecords || []).map((entry: any) => ({
          id: entry.id,
          event_type: entry.payload?.event_type || entry.event_type,
          ip_address: maskIp(entry.ip_address),
          created_at: entry.created_at,
        })),
      },

      // Statistics
      statistics: {
        total_stories: (userStories || []).length,
        total_recording_minutes: Math.round(
          (userStories || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60,
        ),
        stories_with_photos: (userStories || []).filter(
          (s: any) => s.photo_url || (Array.isArray(s.photos) && s.photos.length > 0),
        ).length,
        stories_with_audio: (userStories || []).filter((s: any) => s.audio_url).length,
        oldest_story_year: (userStories || []).length > 0
          ? Math.min(...(userStories || []).map((s: any) => s.story_year || 9999))
          : null,
        newest_story_year: (userStories || []).length > 0
          ? Math.max(...(userStories || []).map((s: any) => s.story_year || 0))
          : null,
        family_members_count: (familyMembersRecords || []).length,
        family_prompts_count: (familyPromptsRecords || []).length,
        saved_prompts_count: (userPromptsRecords || []).length,
        active_prompts_count: (activePromptsRecords || []).length,
        shared_stories_count: (sharedAccessOwned || []).length,
        passkeys_count: (passkeysRecords || []).length,
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
        "Content-Disposition": `attachment; filename="heritagewhisper-export-v3-${new Date().toISOString().split("T")[0]}.json"`,
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
