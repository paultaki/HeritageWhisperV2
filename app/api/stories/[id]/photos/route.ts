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

// GET all photos for a story
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

    // Get the story first to verify ownership
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("photos, user_id")
      .eq("id", params.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get signed URLs for all photos
    const photos = story.photos || [];
    const photosWithSignedUrls = await Promise.all(
      photos.map(async (photo: any) => {
        if (!photo.url) return photo;

        // If already a full URL, use as-is
        if (photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
          return photo;
        }

        // Generate signed URL for storage path
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from('photos')
          .createSignedUrl(photo.url, 3600); // 1 hour expiry

        return {
          ...photo,
          url: signedUrlData?.signedUrl || photo.url
        };
      })
    );

    return NextResponse.json({ photos: photosWithSignedUrls });
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST add a new photo to a story
export async function POST(
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
    const { filePath, isHero } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Get the story to verify ownership and get current photos
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("photos, user_id")
      .eq("id", params.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Generate signed URL for the uploaded photo
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    // Create new photo object
    const newPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: signedUrlData?.signedUrl || filePath,
      transform: { zoom: 1, position: { x: 0, y: 0 } },
      isHero: isHero || false,
      caption: ""
    };

    // If this is marked as hero, unmark other photos
    const currentPhotos = story.photos || [];
    const updatedPhotos = isHero
      ? [...currentPhotos.map((p: any) => ({ ...p, isHero: false })), newPhoto]
      : [...currentPhotos, newPhoto];

    // Update story with new photos array
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from("stories")
      .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating story with photo:", updateError);
      return NextResponse.json(
        { error: "Failed to add photo to story" },
        { status: 500 }
      );
    }

    return NextResponse.json({ photo: newPhoto });
  } catch (error) {
    console.error("Photo add error:", error);
    return NextResponse.json(
      { error: "Failed to add photo" },
      { status: 500 }
    );
  }
}
