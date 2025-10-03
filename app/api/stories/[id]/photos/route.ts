import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, stories } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// Initialize Supabase Admin client (for auth and storage only)
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

    // Get the story first to verify ownership from Neon database
    const [story] = await db
      .select({ photos: stories.photos, userId: stories.userId })
      .from(stories)
      .where(eq(stories.id, params.id));

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    if (story.userId !== user.id) {
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
        // Photos are stored with 'photo/' prefix in heritage-whisper-files bucket
        const photoPath = photo.url.startsWith('photo/') ? photo.url : `photo/${photo.url}`;
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from('heritage-whisper-files')
          .createSignedUrl(photoPath, 3600); // 1 hour expiry

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

    // Get the story to verify ownership and get current photos from Neon database
    const [story] = await db
      .select({ photos: stories.photos, userId: stories.userId })
      .from(stories)
      .where(eq(stories.id, params.id));

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    if (story.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create new photo object - store the PATH, not the signed URL
    const newPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: filePath, // Store the path, not a signed URL
      filePath: filePath, // Also store as filePath for clarity
      transform: { zoom: 1, position: { x: 0, y: 0 } },
      isHero: isHero || false,
      caption: ""
    };

    // If this is marked as hero, unmark other photos
    const currentPhotos = story.photos || [];
    const updatedPhotos = isHero
      ? [...currentPhotos.map((p: any) => ({ ...p, isHero: false })), newPhoto]
      : [...currentPhotos, newPhoto];

    // Update story with new photos array in Neon database
    const [updatedStory] = await db
      .update(stories)
      .set({ photos: updatedPhotos, updatedAt: new Date() })
      .where(eq(stories.id, params.id))
      .returning();

    if (!updatedStory) {
      console.error("Error updating story with photo");
      return NextResponse.json(
        { error: "Failed to add photo to story" },
        { status: 500 }
      );
    }

    // Generate a signed URL for the photo so it can be displayed immediately
    // Photos are stored with 'photo/' prefix in heritage-whisper-files bucket
    const photoPath = filePath.startsWith('photo/') ? filePath : `photo/${filePath}`;
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .createSignedUrl(photoPath, 604800); // 1 week expiry

    const photoWithSignedUrl = {
      ...newPhoto,
      url: signedUrlData?.signedUrl || filePath, // Return signed URL for display
      filePath: filePath // Always include the storage path
    };

    return NextResponse.json({ photo: photoWithSignedUrl });
  } catch (error) {
    console.error("Photo add error:", error);
    return NextResponse.json(
      { error: "Failed to add photo" },
      { status: 500 }
    );
  }
}
