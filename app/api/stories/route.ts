import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTier1Templates as generateTier1TemplatesV2 } from "@/lib/promptGenerationV2";
import { performTier3Analysis, storeTier3Results } from "@/lib/tier3AnalysisV2";
import { generateEchoPrompt, generateEchoAnchorHash } from "@/lib/echoPrompts";
import { validatePromptQuality } from "@/lib/promptQuality";
import { logger } from "@/lib/logger";
import { tier3Ratelimit, aiIpRatelimit, aiGlobalRatelimit, getClientIp } from "@/lib/ratelimit";
import { CreateStorySchema, safeValidateRequestBody } from "@/lib/validationSchemas";
import { ZodError } from "zod";
import { hasAIConsent } from "@/lib/aiConsent";
import { sendNewStoryNotifications } from "@/lib/notifications/send-new-story-notifications";
import { logActivityEvent } from "@/lib/activity";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

    let targetUserId: string;
    let isViewerMode = false;

    // Try JWT authentication first (owners with Supabase Auth)
    const {
      data: { user },
      error: jwtError,
    } = await supabaseAdmin.auth.getUser(token);

    if (user && !jwtError) {
      // JWT authentication successful (authenticated owner)
      // V3: Support storyteller_id query parameter for family sharing
      const { searchParams } = new URL(request.url);
      const storytellerId = searchParams.get('storyteller_id');
      targetUserId = user.id; // Default to own stories

      // If requesting another storyteller's stories, verify access permission
      if (storytellerId && storytellerId !== user.id) {
        // Use RPC function to verify access
        const { data: hasAccess, error: accessError } = await supabaseAdmin.rpc(
          'has_collaboration_access',
          {
            p_user_id: user.id,
            p_storyteller_id: storytellerId,
          }
        );

        if (accessError || !hasAccess) {
          logger.warn(`[Stories API] User ${user.id} denied access to ${storytellerId}'s stories`);
          return NextResponse.json(
            { error: "You don't have permission to view these stories" },
            { status: 403 },
          );
        }

        targetUserId = storytellerId;
        logger.debug(`[Stories API] User ${user.id} viewing ${storytellerId}'s stories`);
      }
    } else {
      // JWT failed - try sessionToken authentication (unauthenticated family viewers)
      const { data: familySession, error: sessionError } = await supabaseAdmin
        .from('family_sessions')
        .select(`
          id,
          family_member_id,
          expires_at,
          family_members!inner (
            id,
            user_id,
            email,
            name,
            relationship,
            permission_level
          )
        `)
        .eq('token', token)
        .single();

      if (sessionError || !familySession) {
        logger.warn('[Stories API] Invalid authentication - neither JWT nor sessionToken valid');
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }

      // Check if session expired
      if (new Date(familySession.expires_at) < new Date()) {
        logger.warn('[Stories API] Family session expired');
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401 },
        );
      }

      // Extract storyteller ID from family_members.user_id
      targetUserId = (familySession as any).family_members.user_id;
      isViewerMode = true;
      logger.debug(`[Stories API] Family viewer accessing ${targetUserId}'s stories via sessionToken`);
    }

    // Fetch stories from Supabase database
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("user_id", targetUserId)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (storiesError) {
      logger.error("Error fetching stories:", storiesError);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 },
      );
    }

    // Helper function to generate signed URLs for photos
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs
      if (photoUrl.startsWith("blob:")) {
        return null;
      }

      // If already a full URL, use as-is
      if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
        return photoUrl;
      }

      // Generate signed URL for storage path
      const { data, error } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(
          photoUrl.startsWith("photo/") ? photoUrl : `photo/${photoUrl}`,
          604800,
        );

      if (error) {
        logger.error("Error creating signed URL for photo:", photoUrl, error);
        return null;
      }

      return data?.signedUrl || null;
    };

    // Transform to match frontend expectations
    const transformedStories = await Promise.all(
      (stories || []).map(async (story) => {
        // Handle photos from top-level photos column (migrated from metadata.photos)
        let photos = [];
        if (story.photos) {
          photos = await Promise.all(
            (story.photos || []).map(async (photo: any) => {
              // Generate signed URLs for dual WebP versions
              const displayUrl = photo.displayPath
                ? await getPhotoUrl(photo.displayPath) // 550px WebP for web display
                : null;

              const masterUrl = photo.masterPath
                ? await getPhotoUrl(photo.masterPath) // 2400px WebP for printing
                : null;

              // Fallback to original file if not yet migrated to WebP
              const legacyUrl = !displayUrl && (photo.url || photo.filePath)
                ? await getPhotoUrl(photo.url || photo.filePath)
                : null;

              return {
                ...photo,
                displayUrl,
                masterUrl,
                url: displayUrl || legacyUrl, // Primary display uses 550px WebP
              };
            }),
          );
        }

        const photoUrl = await getPhotoUrl(story.photo_url);

        return {
          id: story.id,
          title: story.title || "Untitled Story",
          content: story.transcript,
          transcription: story.transcript,
          textBody: story.text_body,
          recordingMode: story.recording_mode,
          createdAt: story.created_at,
          updatedAt: story.updated_at,
          age: story.metadata?.life_age || story.metadata?.age,
          year: story.year,
          storyYear: story.year,
          lifeAge: story.metadata?.life_age,
          includeInTimeline: story.metadata?.include_in_timeline ?? true,
          includeInBook: story.metadata?.include_in_book ?? true,
          isFavorite: story.metadata?.is_favorite ?? false,
          photoUrl: photoUrl,
          photos: photos,
          audioUrl: story.audio_url,
          wisdomTranscription: story.wisdom_text,
          wisdomClipText: story.wisdom_text,
          wisdomClipUrl: story.wisdom_clip_url,
          durationSeconds: story.duration_seconds,
          emotions: story.emotions,
          pivotalCategory: story.metadata?.pivotal_category,
          storyDate: story.story_date || story.metadata?.story_date, // Read from column first, fallback to metadata for legacy data
          photoTransform: story.metadata?.photo_transform,
          chapterId: story.chapter_id,
          chapterOrderIndex: story.chapter_order_index,
        };
      }),
    );

    // V3: Fetch storyteller's user data for family sharing
    // (needed for birth year calculations and display name)
    const { data: storytellerUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, birth_year")
      .eq("id", targetUserId)
      .single();

    if (userError) {
      logger.warn(`[Stories API] Failed to fetch storyteller user data:`, userError);
    }

    // Map to camelCase for frontend
    const storytellerData = storytellerUser ? {
      id: storytellerUser.id,
      name: storytellerUser.name,
      birthYear: storytellerUser.birth_year,
    } : null;

    return NextResponse.json({
      stories: transformedStories,
      storyteller: storytellerData, // Include storyteller metadata
    });
  } catch (error) {
    logger.error("Stories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const rawBody = await request.json();

    // Validate input with Zod schema
    const validationResult = safeValidateRequestBody(CreateStorySchema, rawBody);

    if (!validationResult.success) {
      // Format validation errors for user-friendly response
      const errorMessages = validationResult.error?.issues?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ field: 'unknown', message: 'Validation failed' }];

      logger.warn('[Stories API] Validation failed:', errorMessages);

      return NextResponse.json(
        {
          error: 'Invalid story data',
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    // Use validated data
    const body = validationResult.data;

    // Process photos array (after validation)
    const processedPhotos = (body.photos || [])
      .filter((photo) => {
        if (!photo.url && !photo.filePath) return false;
        if (photo.url && photo.url.startsWith("blob:")) {
          return false;
        }
        return true;
      })
      .map((photo) => {
        if (photo.filePath) {
          return {
            ...photo,
            url: photo.filePath,
          };
        }
        return photo;
      });

    // Prepare story data for Supabase
    // Duration is now validated and constrained by CreateStorySchema (1-600 seconds)
    // Database constraint is 1-120, so we need to clamp to database limits
    const durationForDb = Math.min(body.durationSeconds, 120);

    const storyData = {
      user_id: user.id,
      title: body.title || "Untitled Story",
      transcript: body.transcription || body.content,
      text_body: body.textBody || undefined, // Text-only story content
      recording_mode: body.recordingMode || (body.audioUrl ? 'audio' : body.textBody ? 'text' : 'audio'), // Track recording method
      year: body.year || body.storyYear,
      story_date: body.storyDate || null, // Store full date with month/day
      audio_url:
        body.audioUrl && !body.audioUrl.startsWith("blob:")
          ? body.audioUrl
          : undefined,
      wisdom_text: body.wisdomClipText || body.wisdomTranscription,
      wisdom_clip_url: body.wisdomClipUrl,
      duration_seconds: body.textBody ? null : durationForDb, // No duration for text-only stories
      emotions: body.emotions,
      photo_url:
        body.photoUrl && !body.photoUrl.startsWith("blob:")
          ? body.photoUrl
          : undefined,
      is_saved: true,
      source_prompt_id: body.sourcePromptId || null, // Track which prompt generated this story
      metadata: {
        life_age: body.lifeAge || body.age,
        include_in_timeline: body.includeInTimeline ?? true,
        include_in_book: body.includeInBook ?? true,
        is_favorite: body.isFavorite ?? false,
        photos: processedPhotos,
        pivotal_category: body.pivotalCategory,
        photo_transform: body.photoTransform,
        actual_duration: body.durationSeconds, // Store actual validated duration in metadata
      },
    };

    // Save the story to Supabase
    const { data: newStory, error: insertError } = await supabaseAdmin
      .from("stories")
      .insert(storyData)
      .select()
      .single();

    if (insertError) {
      logger.error("Error creating story:", insertError);
      return NextResponse.json(
        { error: "Failed to create story", details: insertError.message },
        { status: 500 },
      );
    }

    // ============================================================================
    // FAMILY NOTIFICATIONS: Notify family members about new story (async, non-blocking)
    // ============================================================================
    sendNewStoryNotifications({
      storytellerUserId: user.id,
      storyId: newStory.id,
      storyTitle: newStory.title,
      storyYear: newStory.year || undefined,
      heroPhotoPath: newStory.photo_url || undefined,
      transcript: newStory.transcript || '',
    }).catch((error) => {
      // Log error but don't fail the request
      logger.error('[Stories API] Failed to send story notification emails:', error);
    });

    // ============================================================================
    // ACTIVITY TRACKING: Log story_recorded event (async, non-blocking)
    // ============================================================================
    logActivityEvent({
      userId: user.id,
      actorId: user.id,
      storyId: newStory.id,
      eventType: "story_recorded",
      metadata: {
        storyTitle: newStory.title,
        year: newStory.year,
        hasAudio: !!newStory.audio_url,
        hasPhoto: !!newStory.photo_url,
      },
    }).catch((error) => {
      // Log error but don't fail the request
      logger.error('[Stories API] Failed to log story_recorded activity:', error);
    });

    // ============================================================================
    // PROMPT TRACKING: Mark source prompt as "used" if applicable
    // ============================================================================
    if (body.sourcePromptId) {
      try {
        logger.debug(
          "[Stories API] Marking prompt as used:",
          body.sourcePromptId,
        );

        // Fetch the prompt to archive it
        const { data: usedPrompt, error: promptFetchError } =
          await supabaseAdmin
            .from("active_prompts")
            .select("*")
            .eq("id", body.sourcePromptId)
            .eq("user_id", user.id)
            .single();

        if (promptFetchError) {
          logger.warn(
            "[Stories API] Could not fetch prompt to archive:",
            promptFetchError,
          );
        } else if (usedPrompt) {
          // Archive to prompt_history
          const { error: historyError } = await supabaseAdmin
            .from("prompt_history")
            .insert({
              user_id: user.id,
              prompt_text: usedPrompt.prompt_text,
              anchor_hash: usedPrompt.anchor_hash,
              anchor_entity: usedPrompt.anchor_entity,
              anchor_year: usedPrompt.anchor_year,
              tier: usedPrompt.tier,
              memory_type: usedPrompt.memory_type,
              prompt_score: usedPrompt.prompt_score,
              shown_count: usedPrompt.shown_count,
              outcome: "used",
              story_id: newStory.id,
              created_at: usedPrompt.created_at,
            });

          if (historyError) {
            logger.warn(
              "[Stories API] Could not archive prompt to history:",
              historyError,
            );
          }

          // Delete from active_prompts
          const { error: deleteError } = await supabaseAdmin
            .from("active_prompts")
            .delete()
            .eq("id", body.sourcePromptId);

          if (deleteError) {
            logger.warn(
              "[Stories API] Could not delete active prompt:",
              deleteError,
            );
          } else {
            logger.debug(
              "[Stories API] Successfully marked prompt as used and archived",
            );
          }
        }
      } catch (promptError) {
        // Log but don't fail the request
        logger.error(
          "[Stories API] Error handling source prompt:",
          promptError,
        );
      }
    }

    // ============================================================================
    // AI CONSENT CHECK: Skip all prompt generation if AI is disabled
    // ============================================================================
    const aiEnabled = await hasAIConsent(user.id);

    if (!aiEnabled) {
      logger.debug("[Stories API] AI processing disabled for user, skipping prompt generation");

      // Return the story immediately without generating prompts
      const transformedStory = {
        id: newStory.id,
        title: newStory.title,
        content: newStory.transcript,
        transcription: newStory.transcript,
        createdAt: newStory.created_at,
        updatedAt: newStory.updated_at,
        year: newStory.year,
        storyYear: newStory.year,
        lifeAge: newStory.metadata?.life_age,
        includeInTimeline: newStory.metadata?.include_in_timeline,
        includeInBook: newStory.metadata?.include_in_book,
        isFavorite: newStory.metadata?.is_favorite,
        photoUrl: newStory.photo_url,
        photos: newStory.photos || [],
        audioUrl: newStory.audio_url,
        wisdomTranscription: newStory.wisdom_text,
        wisdomClipText: newStory.wisdom_text,
        wisdomClipUrl: newStory.wisdom_clip_url,
        durationSeconds: newStory.duration_seconds,
        emotions: newStory.emotions,
        pivotalCategory: newStory.metadata?.pivotal_category,
        storyDate: newStory.metadata?.story_date,
        photoTransform: newStory.metadata?.photo_transform,
      };

      return NextResponse.json({ story: transformedStory });
    }

    // ============================================================================
    // TIER 1 V2: Generate relationship-first prompts (quality-gated)
    // ============================================================================
    logger.debug(
      "[Stories API] Generating Tier 1 V2 prompts for story:",
      newStory.id,
    );

    try {
      const tier1Prompts = generateTier1TemplatesV2(
        newStory.transcript || "",
        newStory.year,
      );

      // V2 already filters through quality gates during generation
      if (tier1Prompts.length > 0) {
        logger.debug(
          `[Stories API] ${tier1Prompts.length} Tier 1 V2 prompts generated (quality-validated):`,
          tier1Prompts.map((p) => ({ entity: p.entity, type: p.type, words: p.wordCount })),
        );

        // Calculate 7-day expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Store ALL prompts in active_prompts table
        const promptsToInsert = tier1Prompts.map((prompt) => ({
          user_id: user.id,
          prompt_text: prompt.text,
          context_note: prompt.context,
          anchor_entity: prompt.entity,
          anchor_year: newStory.year,
          anchor_hash: prompt.anchorHash,
          tier: 1,
          memory_type: prompt.memoryType,
          prompt_score: prompt.promptScore,
          score_reason: "Relationship-first prompt from V2 engine",
          model_version: "tier1-v2-intimacy",
          expires_at: expiresAt.toISOString(),
          is_locked: false,
          shown_count: 0,
        }));

        const { error: promptError } = await supabaseAdmin
          .from("active_prompts")
          .insert(promptsToInsert);

        if (promptError) {
          // Check if it's a duplicate key error (expected - deduplication working)
          if (promptError.code === "23505") {
            logger.debug(
              "[Stories API] Some Tier 1 V2 prompts already exist (deduplication working)",
            );
          } else {
            // Log unexpected errors but don't fail the request
            logger.error(
              "[Stories API] Failed to store Tier 1 V2 prompts:",
              promptError,
            );
          }
        } else {
          logger.debug(
            `[Stories API] ${tier1Prompts.length} Tier 1 V2 prompts stored successfully`,
          );
        }
      } else {
        logger.debug(
          "[Stories API] No Tier 1 V2 prompts generated (no worthy entities found or all rejected by quality gates)",
        );
      }
    } catch (promptGenError) {
      // Log error but don't fail the request
      logger.error(
        "[Stories API] Error generating Tier 1 V2 prompts:",
        promptGenError,
      );
    }

    // ============================================================================
    // ECHO PROMPT: Generate instant follow-up (shows we're listening)
    // ============================================================================
    logger.debug("[Stories API] Generating echo prompt for immediate engagement");

    try {
      const echoPromptText = await generateEchoPrompt(newStory.transcript || "");

      if (echoPromptText) {
        // Quality gate: validate echo prompt before storing
        const isValid = validatePromptQuality(echoPromptText);

        if (isValid) {
          logger.debug("[Stories API] Echo prompt generated (validated):", echoPromptText);

          // Calculate 7-day expiry
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          // Store echo prompt
          const { error: echoError } = await supabaseAdmin
            .from("active_prompts")
            .insert({
              user_id: user.id,
              prompt_text: echoPromptText,
              context_note: "Inspired by what you just shared",
              anchor_entity: "echo",
              anchor_year: newStory.year,
              anchor_hash: generateEchoAnchorHash(newStory.transcript || ""),
              tier: 1,
              memory_type: "echo",
              prompt_score: 75, // High score - immediate engagement
              score_reason: "Instant follow-up to show active listening",
              model_version: "gpt-4o-mini-echo",
              expires_at: expiresAt.toISOString(),
              is_locked: false,
              shown_count: 0,
            });

          if (echoError) {
            if (echoError.code === "23505") {
              logger.debug("[Stories API] Echo prompt already exists (deduplication)");
            } else {
              logger.error("[Stories API] Failed to store echo prompt:", echoError);
            }
          } else {
            logger.debug("[Stories API] Echo prompt stored successfully");
          }
        } else {
          logger.warn("[Stories API] Echo prompt rejected by quality gate:", echoPromptText);
        }
      } else {
        logger.debug("[Stories API] No echo prompt generated");
      }
    } catch (echoError) {
      // Log error but don't fail the request
      logger.error("[Stories API] Error generating echo prompt:", echoError);
    }

    // ============================================================================
    // MILESTONE DETECTION: Check if we should trigger Tier 3 analysis
    // ============================================================================
    try {
      // Count total stories for this user
      const { count: storyCount, error: countError } = await supabaseAdmin
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        logger.error("[Stories API] Failed to count stories:", countError);
      } else {
        logger.debug(`[Stories API] User now has ${storyCount} total stories`);

        // Milestone thresholds from spec
        const MILESTONES = [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100];

        if (MILESTONES.includes(storyCount || 0)) {
          logger.debug(`[Stories API] 🎯 MILESTONE HIT: Story #${storyCount}!`);
          logger.debug(`[Stories API] Triggering Tier 3 combined analysis...`);

          // Fetch all user stories for analysis
          const { data: allStories, error: storiesError } = await supabaseAdmin
            .from("stories")
            .select("id, title, transcript, lesson_learned, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

          if (storiesError || !allStories) {
            logger.error(
              "[Stories API] Failed to fetch stories for Tier 3:",
              storiesError,
            );
          } else {
            try {
              // Multi-layer rate limiting for expensive Tier 3 analysis
              const clientIp = getClientIp(request);

              // Layer 1: User-based rate limit (1 per 5 minutes)
              const userRateLimitResult = await tier3Ratelimit.limit(user.id);

              // Layer 2: IP-based rate limit (10 per hour per IP)
              const ipRateLimitResult = await aiIpRatelimit.limit(clientIp);

              // Layer 3: Global rate limit (1000 per hour total)
              const globalRateLimitResult = await aiGlobalRatelimit.limit('tier3-global');

              // Check if any rate limit failed
              if (!userRateLimitResult.success) {
                logger.warn(
                  `[Stories API] ⏱️  Tier 3 USER rate limit exceeded for ${user.id}. Skipping analysis.`,
                  {
                    reset: new Date(userRateLimitResult.reset),
                    remaining: userRateLimitResult.remaining,
                  }
                );
              } else if (!ipRateLimitResult.success) {
                logger.warn(
                  `[Stories API] ⏱️  Tier 3 IP rate limit exceeded for ${clientIp}. Skipping analysis.`,
                  {
                    reset: new Date(ipRateLimitResult.reset),
                    remaining: ipRateLimitResult.remaining,
                  }
                );
              } else if (!globalRateLimitResult.success) {
                logger.error(
                  `[Stories API] 🚨 Tier 3 GLOBAL rate limit exceeded - system under load. Skipping analysis.`,
                  {
                    reset: new Date(globalRateLimitResult.reset),
                    remaining: globalRateLimitResult.remaining,
                  }
                );
              } else {
                // All rate limits passed - proceed with Tier 3 analysis IN BACKGROUND
                logger.debug(`[Stories API] All rate limits OK. Queueing Tier 3 analysis for background processing...`);

                // Fire and forget - don't block the response
                setImmediate(async () => {
                  try {
                    logger.debug(`[Tier 3 Background] Starting analysis for Story #${storyCount}...`);

                    // Perform GPT-4o/GPT-5 combined analysis
                    const tier3Result = await performTier3Analysis(
                      allStories,
                      storyCount ?? 0,
                    );

                    // Log AI call telemetry
                    if (tier3Result._meta) {
                      logger.info({
                        op: "ai_call",
                        stage: "tier3_background",
                        milestone: storyCount,
                        model: tier3Result._meta.modelUsed,
                        effort: tier3Result._meta.reasoningEffort,
                        ttftMs: tier3Result._meta.ttftMs,
                        latencyMs: tier3Result._meta.latencyMs,
                        costUsd: tier3Result._meta.costUsd,
                        tokensUsed: tier3Result._meta.tokensUsed,
                      });
                    }

                    // Store prompts and character insights
                    await storeTier3Results(
                      supabaseAdmin,
                      user.id,
                      storyCount ?? 0,
                      tier3Result,
                    );

                    logger.debug(
                      `[Tier 3 Background] ✅ Analysis complete for Story #${storyCount}. Prompts now available in user's queue.`,
                    );
                  } catch (backgroundError) {
                    logger.error(
                      `[Tier 3 Background] Analysis failed for Story #${storyCount}:`,
                      backgroundError instanceof Error ? backgroundError.message : backgroundError,
                    );
                  }
                });

                logger.debug(`[Stories API] Tier 3 analysis queued for background. Returning response to user immediately.`);
              }

              // Log Story 3 paywall status
              if (storyCount === 3) {
                logger.debug(
                  `[Stories API] 💎 Story 3 paywall: 1 prompt unlocked, 3 locked (premium seed)`,
                );
              }
            } catch (tier3Error) {
              logger.error("[Stories API] Tier 3 analysis failed:", tier3Error);
              // Don't fail the request - Tier 3 is bonus functionality
            }
          }
        } else {
          logger.debug(
            `[Stories API] Not a milestone (next milestone at ${MILESTONES.find((m) => m > (storyCount || 0)) || "100+"})`,
          );
        }
      }
    } catch (milestoneError) {
      logger.error("[Stories API] Error checking milestone:", milestoneError);
    }

    // Transform the response
    const transformedStory = {
      id: newStory.id,
      title: newStory.title,
      content: newStory.transcript,
      transcription: newStory.transcript,
      createdAt: newStory.created_at,
      updatedAt: newStory.updated_at,
      year: newStory.year,
      storyYear: newStory.year,
      lifeAge: newStory.metadata?.life_age,
      includeInTimeline: newStory.metadata?.include_in_timeline,
      includeInBook: newStory.metadata?.include_in_book,
      isFavorite: newStory.metadata?.is_favorite,
      photoUrl: newStory.photo_url,
      photos: newStory.photos || [],
      audioUrl: newStory.audio_url,
      wisdomTranscription: newStory.wisdom_text,
      wisdomClipText: newStory.wisdom_text,
      wisdomClipUrl: newStory.wisdom_clip_url,
      durationSeconds: newStory.duration_seconds,
      emotions: newStory.emotions,
      pivotalCategory: newStory.metadata?.pivotal_category,
      storyDate: newStory.story_date || newStory.metadata?.story_date, // Read from column first, fallback to metadata for legacy data
      photoTransform: newStory.metadata?.photo_transform,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    logger.error("Story creation error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 },
    );
  }
}
