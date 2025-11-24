import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getPasskeySession } from "@/lib/iron-session";
// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/treasures/[id] - Update treasure
 *
 * Body (JSON or FormData):
 * - isFavorite?: boolean
 * - title?: string
 * - description?: string
 * - category?: string
 * - year?: number
 * - linkedStoryId?: string | null
 * - transform?: { zoom: number; position: { x: number; y: number } }
 * - image?: File (FormData only - replaces existing photo)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validate session - get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const userId = user.id;

    const { id } = await context.params;

    // Check content type to determine how to parse body
    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    let body: any = {};
    let imageFile: File | null = null;

    if (isFormData) {
      const formData = await request.formData();

      // Extract form fields
      if (formData.has("title")) body.title = formData.get("title");
      if (formData.has("description")) body.description = formData.get("description");
      if (formData.has("category")) body.category = formData.get("category");
      if (formData.has("year")) body.year = parseInt(formData.get("year") as string);
      if (formData.has("transform")) body.transform = JSON.parse(formData.get("transform") as string);
      if (formData.has("isFavorite")) body.isFavorite = formData.get("isFavorite") === "true";
      if (formData.has("linkedStoryId")) body.linkedStoryId = formData.get("linkedStoryId");

      // Extract image file if present
      imageFile = formData.get("image") as File | null;
    } else {
      body = await request.json();
    }

    // Process image replacement if provided
    if (imageFile) {
      // Convert image to Buffer and process to dual WebP versions
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate and process image
      const { validateImage, processImageToWebP } = await import("@/lib/imageProcessor");
      const isValidImage = await validateImage(buffer);

      if (!isValidImage) {
        return NextResponse.json(
          { error: "Invalid image file" },
          { status: 400 }
        );
      }

      // Process image to dual WebP versions (Master + Display)
      const { master, display } = await processImageToWebP(buffer);

      // Generate unique filenames
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const baseFilename = `treasure/${userId}/${timestamp}-${randomId}`;
      const masterFilename = `${baseFilename}-master.webp`;
      const displayFilename = `${baseFilename}-display.webp`;

      // Upload Master WebP
      const { error: masterError } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .upload(masterFilename, master.buffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (masterError) {
        console.error("Master WebP upload error:", masterError);
        return NextResponse.json(
          { error: "Failed to upload master image" },
          { status: 500 }
        );
      }

      // Upload Display WebP
      const { error: displayError } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .upload(displayFilename, display.buffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (displayError) {
        console.error("Display WebP upload error:", displayError);
        // Clean up master file
        await supabaseAdmin.storage
          .from("heritage-whisper-files")
          .remove([masterFilename]);
        return NextResponse.json(
          { error: "Failed to upload display image" },
          { status: 500 }
        );
      }

      // Generate signed URLs
      const { data: masterSignedUrl } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(masterFilename, 604800);

      const { data: displaySignedUrl } = await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .createSignedUrl(displayFilename, 604800);

      // Update image paths and dimensions
      body.master_path = masterFilename;
      body.display_path = displayFilename;
      body.image_url = displaySignedUrl?.signedUrl || displayFilename;
      body.image_width = master.width;
      body.image_height = master.height;
    }

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
    if (body.transform !== undefined) {
      updates.transform = body.transform;
    }
    if (body.master_path !== undefined) {
      updates.master_path = body.master_path;
    }
    if (body.display_path !== undefined) {
      updates.display_path = body.display_path;
    }
    if (body.image_url !== undefined) {
      updates.image_url = body.image_url;
    }
    if (body.image_width !== undefined) {
      updates.image_width = body.image_width;
    }
    if (body.image_height !== undefined) {
      updates.image_height = body.image_height;
    }

    // Update treasure (RLS ensures user owns it)
    const { data: treasure, error } = await supabaseAdmin
      .from("treasures")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
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
    // Validate session - get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const userId = user.id;

    const { id } = await context.params;

    // Get treasure to find image URL
    const { data: treasure } = await supabaseAdmin
      .from("treasures")
      .select("image_url")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!treasure) {
      return NextResponse.json(
        { error: "Treasure not found" },
        { status: 404 }
      );
    }

    // Delete from database (RLS ensures user owns it)
    const { error: dbError } = await supabaseAdmin
      .from("treasures")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

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
        await supabaseAdmin.storage
          .from("heritage-whisper-files")
          .remove([`${userId}/${fileName}`])
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
