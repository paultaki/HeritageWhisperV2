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

// PATCH update a photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
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

    // Get the story to verify ownership and get current photos
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("photos, user_id")
      .eq("id", params.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentPhotos = story.photos || [];
    const photoIndex = currentPhotos.findIndex(
      (p: any) => p.id === params.photoId,
    );

    if (photoIndex === -1) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // If marking this photo as hero, unmark others
    const updatedPhotos = currentPhotos.map((p: any, idx: number) => {
      if (idx === photoIndex) {
        return { ...p, ...body };
      }
      if (body.isHero === true && p.isHero) {
        return { ...p, isHero: false };
      }
      return p;
    });

    // Update story with modified photos array
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from("stories")
      .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating photo:", updateError);
      return NextResponse.json(
        { error: "Failed to update photo" },
        { status: 500 },
      );
    }

    return NextResponse.json({ photo: updatedPhotos[photoIndex] });
  } catch (error) {
    logger.error("Photo update error:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 },
    );
  }
}

// DELETE a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
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

    // Get the story to verify ownership and get current photos
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("photos, user_id")
      .eq("id", params.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentPhotos = story.photos || [];
    const photoToDelete = currentPhotos.find(
      (p: any) => p.id === params.photoId,
    );

    if (!photoToDelete) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Remove photo from array
    const updatedPhotos = currentPhotos.filter(
      (p: any) => p.id !== params.photoId,
    );

    // If deleted photo was hero and there are other photos, make the first one hero
    if (
      photoToDelete.isHero &&
      updatedPhotos.length > 0 &&
      !updatedPhotos.some((p: any) => p.isHero)
    ) {
      updatedPhotos[0].isHero = true;
    }

    // Update story with modified photos array
    const { error: updateError } = await supabaseAdmin
      .from("stories")
      .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (updateError) {
      logger.error("Error deleting photo:", updateError);
      return NextResponse.json(
        { error: "Failed to delete photo" },
        { status: 500 },
      );
    }

    // Optionally delete from storage (commented out to keep files for safety)
    // if (photoToDelete.url && !photoToDelete.url.startsWith('http')) {
    //   await supabaseAdmin.storage.from('photos').remove([photoToDelete.url]);
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Photo deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 },
    );
  }
}
