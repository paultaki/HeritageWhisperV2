import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/treasures/[id] - Update treasure
 *
 * Body:
 * - isFavorite?: boolean
 * - title?: string
 * - description?: string
 * - category?: string
 * - year?: number
 * - linkedStoryId?: string | null
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();

    // Validate session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.isFavorite !== undefined) {
      updates.is_favorite = body.isFavorite;
    }
    if (body.title !== undefined) {
      updates.title = body.title;
    }
    if (body.description !== undefined) {
      updates.description = body.description;
    }
    if (body.category !== undefined) {
      updates.category = body.category;
    }
    if (body.year !== undefined) {
      updates.year = body.year;
    }
    if (body.linkedStoryId !== undefined) {
      updates.linked_story_id = body.linkedStoryId;
    }

    // Update treasure (RLS ensures user owns it)
    const { data: treasure, error } = await supabase
      .from("treasures")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Treasure not found or access denied" },
          { status: 404 }
        );
      }
      console.error("Error updating treasure:", error);
      return NextResponse.json(
        { error: "Failed to update treasure" },
        { status: 500 }
      );
    }

    // Map to camelCase
    const mapped = {
      id: treasure.id,
      userId: treasure.user_id,
      title: treasure.title,
      description: treasure.description,
      category: treasure.category,
      year: treasure.year,
      imageUrl: treasure.image_url,
      thumbnailUrl: treasure.thumbnail_url,
      isFavorite: treasure.is_favorite,
      linkedStoryId: treasure.linked_story_id,
      createdAt: treasure.created_at,
      updatedAt: treasure.updated_at,
    };

    return NextResponse.json({ treasure: mapped });
  } catch (err) {
    console.error("Error in PATCH /api/treasures/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/treasures/[id] - Delete treasure
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();

    // Validate session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Get treasure to find image URL
    const { data: treasure } = await supabase
      .from("treasures")
      .select("image_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!treasure) {
      return NextResponse.json(
        { error: "Treasure not found" },
        { status: 404 }
      );
    }

    // Delete from database (RLS ensures user owns it)
    const { error: dbError } = await supabase
      .from("treasures")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("Error deleting treasure:", dbError);
      return NextResponse.json(
        { error: "Failed to delete treasure" },
        { status: 500 }
      );
    }

    // Try to delete image from storage (non-blocking)
    if (treasure.image_url) {
      const fileName = treasure.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("heritage-whisper-files")
          .remove([`${user.id}/${fileName}`])
          .catch((err) => console.error("Error deleting image:", err));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/treasures/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
