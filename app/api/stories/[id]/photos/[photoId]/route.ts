import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// PATCH update a photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
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

    if (story.user_id !== userId) {
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

    // Get the story to verify ownership and get current photos
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("photos, user_id")
      .eq("id", params.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.user_id !== userId) {
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
