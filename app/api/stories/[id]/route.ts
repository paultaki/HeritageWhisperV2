import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET single story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Fetch the story from Supabase
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedStory = {
      id: story.id,
      title: story.title,
      content: story.content || story.transcription,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      age: story.age || story.life_age,
      year: story.story_year,
      storyYear: story.story_year,
      includeInTimeline: story.include_in_timeline ?? true,
      includeInBook: story.include_in_book ?? true,
      isFavorite: story.is_favorite ?? false,
      photoUrl: story.photo_url,
      hasPhotos: story.has_photos ?? false,
      photos: story.photos || [],
      audioUrl: story.audio_url,
      transcription: story.transcription,
      wisdomTranscription: story.wisdom_transcription || story.wisdom_clip_text,
      wisdomClipText: story.wisdom_clip_text,
      followUpQuestions: story.follow_up_questions,
      wisdomClipUrl: story.wisdom_clip_url,
      durationSeconds: story.duration_seconds,
      emotions: story.emotions,
      pivotalCategory: story.pivotal_category,
      storyDate: story.story_date,
      photoTransform: story.photo_transform,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    console.error("Story fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

// PUT update story
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Prepare story data for Supabase (using snake_case)
    const storyData: any = {
      title: body.title,
      transcription: body.transcription || body.content,
      life_age: body.lifeAge || body.age,
      story_year: body.year || body.storyYear,
      include_in_timeline: body.includeInTimeline ?? true,
      include_in_book: body.includeInBook ?? true,
      is_favorite: body.isFavorite ?? false,
      photo_url: body.photoUrl,
      photos: body.photos || [],
      audio_url: body.audioUrl,
      wisdom_clip_text: body.wisdomClipText || body.wisdomTranscription,
      wisdom_clip_url: body.wisdomClipUrl,
      duration_seconds: body.durationSeconds || 0,
      emotions: body.emotions,
      pivotal_category: body.pivotalCategory,
      story_date: body.storyDate,
      photo_transform: body.photoTransform,
      updated_at: new Date().toISOString(),
    };

    // Update the story in Supabase
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from("stories")
      .update(storyData)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating story:", updateError);
      return NextResponse.json(
        { error: "Failed to update story", details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedStory) {
      return NextResponse.json(
        { error: "Story not found or unauthorized" },
        { status: 404 }
      );
    }

    // Transform the response to camelCase
    const transformedStory = {
      id: updatedStory.id,
      title: updatedStory.title,
      content: updatedStory.content || updatedStory.transcription,
      createdAt: updatedStory.created_at,
      updatedAt: updatedStory.updated_at,
      age: updatedStory.age || updatedStory.life_age,
      year: updatedStory.story_year,
      storyYear: updatedStory.story_year,
      includeInTimeline: updatedStory.include_in_timeline,
      includeInBook: updatedStory.include_in_book,
      isFavorite: updatedStory.is_favorite,
      photoUrl: updatedStory.photo_url,
      hasPhotos: updatedStory.has_photos,
      photos: updatedStory.photos || [],
      audioUrl: updatedStory.audio_url,
      transcription: updatedStory.transcription,
      wisdomTranscription: updatedStory.wisdom_transcription || updatedStory.wisdom_clip_text,
      followUpQuestions: updatedStory.follow_up_questions,
      wisdomClipUrl: updatedStory.wisdom_clip_url,
      durationSeconds: updatedStory.duration_seconds,
      emotions: updatedStory.emotions,
      pivotalCategory: updatedStory.pivotal_category,
      storyDate: updatedStory.story_date,
      photoTransform: updatedStory.photo_transform,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    console.error("Story update error:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE story
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Delete the story from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from("stories")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting story:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete story", details: deleteError.message },
        { status: 500 }
      );
    }

    // Update user's story count - first get current count
    const { data: userData, error: getUserError } = await supabaseAdmin
      .from("users")
      .select("story_count")
      .eq("id", user.id)
      .single();

    if (!getUserError && userData && userData.story_count > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          story_count: userData.story_count - 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating story count:", updateError);
        // Don't fail the request, story was deleted successfully
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Story deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}