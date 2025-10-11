import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTier1Templates } from "@/lib/promptGeneration";
import { performTier3Analysis, storeTier3Results } from "@/lib/tier3Analysis";
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
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Fetch stories from Supabase database
    const { data: stories, error: storiesError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
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
        // Handle photos if stored as JSON
        let photos = [];
        if (story.metadata?.photos) {
          photos = await Promise.all(
            (story.metadata.photos || []).map(async (photo: any) => ({
              ...photo,
              url: await getPhotoUrl(photo.url || photo.filePath),
            })),
          );
        }

        const photoUrl = await getPhotoUrl(story.photo_url);

        return {
          id: story.id,
          title: story.title || "Untitled Story",
          content: story.transcript,
          transcription: story.transcript,
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
          storyDate: story.metadata?.story_date,
          photoTransform: story.metadata?.photo_transform,
        };
      }),
    );

    return NextResponse.json({ stories: transformedStories });
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

    const body = await request.json();

    // Process photos array
    const processedPhotos = (body.photos || [])
      .filter((photo: any) => {
        if (!photo.url && !photo.filePath) return false;
        if (photo.url && photo.url.startsWith("blob:")) {
          return false;
        }
        return true;
      })
      .map((photo: any) => {
        if (photo.filePath) {
          return {
            ...photo,
            url: photo.filePath,
          };
        }
        return photo;
      });

    // Prepare story data for Supabase using actual schema
    // Note: duration_seconds has a check constraint (must be between 1 and 120)
    const duration = body.durationSeconds || 30; // Default to 30 seconds if not provided
    const constrainedDuration = Math.max(1, Math.min(120, duration)); // Ensure between 1-120

    const storyData = {
      user_id: user.id,
      title: body.title || "Untitled Story",
      transcript: body.transcription || body.content,
      year: body.year || body.storyYear,
      audio_url:
        body.audioUrl && !body.audioUrl.startsWith("blob:")
          ? body.audioUrl
          : undefined,
      wisdom_text: body.wisdomClipText || body.wisdomTranscription,
      wisdom_clip_url: body.wisdomClipUrl,
      duration_seconds: constrainedDuration,
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
        story_date: body.storyDate,
        photo_transform: body.photoTransform,
        actual_duration: body.durationSeconds, // Store actual duration in metadata
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
    // TIER 1: Generate template-based prompts (1-3 per story, synchronous)
    // ============================================================================
    logger.debug(
      "[Stories API] Generating Tier 1 prompts for story:",
      newStory.id,
    );

    try {
      const tier1Prompts = generateTier1Templates(
        newStory.transcript || "",
        newStory.year,
      );

      if (tier1Prompts.length > 0) {
        logger.debug(
          `[Stories API] ${tier1Prompts.length} Tier 1 prompts generated:`,
          tier1Prompts.map((p) => ({ entity: p.entity, type: p.type })),
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
          score_reason: "Template-based prompt from entity extraction",
          model_version: "tier1-template",
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
              "[Stories API] Some Tier 1 prompts already exist (deduplication working)",
            );
          } else {
            // Log unexpected errors but don't fail the request
            logger.error(
              "[Stories API] Failed to store Tier 1 prompts:",
              promptError,
            );
          }
        } else {
          logger.debug(
            `[Stories API] ${tier1Prompts.length} Tier 1 prompts stored successfully`,
          );
        }
      } else {
        logger.debug(
          "[Stories API] No Tier 1 prompts generated (no entities found)",
        );
      }
    } catch (promptGenError) {
      // Log error but don't fail the request
      logger.error(
        "[Stories API] Error generating Tier 1 prompts:",
        promptGenError,
      );
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
              // Perform GPT-4o combined analysis
              const tier3Result = await performTier3Analysis(
                allStories,
                storyCount,
              );

              // Store prompts and character insights
              await storeTier3Results(
                supabaseAdmin,
                user.id,
                storyCount,
                tier3Result,
              );

              logger.debug(
                `[Stories API] ✅ Tier 3 analysis complete for Story #${storyCount}`,
              );

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
      photos: newStory.metadata?.photos || [],
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
  } catch (error) {
    logger.error("Story creation error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 },
    );
  }
}
