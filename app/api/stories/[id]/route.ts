import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, stories, users } from "@/lib/db";
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

    // Fetch the story from Neon database using Drizzle
    const [story] = await db
      .select()
      .from(stories)
      .where(and(eq(stories.id, params.id), eq(stories.userId, user.id)));

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Helper function to generate signed URLs for photos
    const getSignedPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return photoUrl;

      // If already a full URL (starts with http/https), use as-is
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
      }

      // Generate signed URL for storage path (valid for 1 hour)
      // Photos are stored with 'photo/' prefix in heritage-whisper-files bucket
      try {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from('heritage-whisper-files')
          .createSignedUrl(photoUrl.startsWith('photo/') ? photoUrl : `photo/${photoUrl}`, 3600);

        return signedUrlData?.signedUrl || photoUrl;
      } catch (error) {
        console.error('Error generating signed URL for photo:', photoUrl, error);
        return photoUrl;
      }
    };

    // Process photos array to add signed URLs
    const photosWithSignedUrls = await Promise.all(
      (story.photos || []).map(async (photo: any) => ({
        ...photo,
        url: await getSignedPhotoUrl(photo.url)
      }))
    );

    // Process legacy photoUrl if exists
    const signedPhotoUrl = story.photoUrl ? await getSignedPhotoUrl(story.photoUrl) : undefined;

    // Transform to frontend-compatible format (fields already in camelCase from Drizzle)
    const transformedStory = {
      id: story.id,
      title: story.title,
      content: story.content || story.transcription,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      age: story.age || story.lifeAge,
      year: story.storyYear,
      storyYear: story.storyYear,
      lifeAge: story.lifeAge,
      includeInTimeline: story.includeInTimeline ?? true,
      includeInBook: story.includeInBook ?? true,
      isFavorite: story.isFavorite ?? false,
      photoUrl: signedPhotoUrl,
      hasPhotos: story.hasPhotos ?? false,
      photos: photosWithSignedUrls,
      audioUrl: story.audioUrl,
      transcription: story.transcription,
      wisdomTranscription: story.wisdomTranscription || story.wisdomClipText,
      wisdomClipText: story.wisdomClipText,
      followUpQuestions: story.followUpQuestions,
      wisdomClipUrl: story.wisdomClipUrl,
      durationSeconds: story.durationSeconds,
      emotions: story.emotions,
      pivotalCategory: story.pivotalCategory,
      storyDate: story.storyDate,
      photoTransform: story.photoTransform,
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

    // Process photos array - use filePath if available, otherwise extract from URL
    const processedPhotos = (body.photos || []).filter((photo: any) => {
      if (!photo.url && !photo.filePath) return false;
      // Skip blob URLs - these are invalid temporary URLs
      if (photo.url && photo.url.startsWith('blob:')) {
        console.warn('Blob URL found in photos array - filtering out:', photo.url);
        return false;
      }
      return true;
    }).map((photo: any) => {
      // If we have a filePath, use it as the url (for storage)
      if (photo.filePath) {
        return {
          ...photo,
          url: photo.filePath // Store the path, not the signed URL
        };
      }

      // If the URL is a signed Supabase URL, extract the path
      if (photo.url && photo.url.includes('supabase.co/storage/v1/object/sign/')) {
        // Extract the path from the signed URL
        const urlParts = photo.url.split('/');
        const pathStartIndex = urlParts.indexOf('photos') + 1;
        if (pathStartIndex > 0 && pathStartIndex < urlParts.length) {
          const filePath = urlParts.slice(pathStartIndex).join('/').split('?')[0];
          return {
            ...photo,
            url: `${decodeURIComponent(filePath)}` // Store the extracted path
          };
        }
      }

      // Otherwise keep the photo as-is (might be a path already)
      return photo;
    });

    // Update the story in Neon database using Drizzle
    const [updatedStory] = await db
      .update(stories)
      .set({
        title: body.title,
        transcription: body.transcription || body.content,
        lifeAge: body.lifeAge || body.age,
        storyYear: body.year || body.storyYear,
        includeInTimeline: body.includeInTimeline ?? true,
        includeInBook: body.includeInBook ?? true,
        isFavorite: body.isFavorite ?? false,
        photoUrl: body.photoUrl && !body.photoUrl.startsWith('blob:') ? body.photoUrl : undefined,
        photos: processedPhotos,
        audioUrl: body.audioUrl,
        wisdomClipText: body.wisdomClipText || body.wisdomTranscription,
        wisdomClipUrl: body.wisdomClipUrl,
        durationSeconds: body.durationSeconds || 0,
        emotions: body.emotions,
        pivotalCategory: body.pivotalCategory,
        storyDate: body.storyDate,
        photoTransform: body.photoTransform,
        updatedAt: new Date(),
      })
      .where(and(eq(stories.id, params.id), eq(stories.userId, user.id)))
      .returning();

    if (!updatedStory) {
      return NextResponse.json(
        { error: "Story not found or unauthorized" },
        { status: 404 }
      );
    }

    // Helper function to generate signed URLs for photos (reuse from GET)
    const getPhotoUrl = async (photoUrl: string) => {
      if (!photoUrl) return null;

      // Skip blob URLs - these are invalid temporary URLs
      if (photoUrl.startsWith('blob:')) {
        console.warn('Blob URL found in database - this should not happen:', photoUrl);
        return null;
      }

      // If already a full URL (starts with http/https), use as-is
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
      }

      // Generate signed URL for storage path (valid for 1 week)
      // Photos are stored with 'photo/' prefix in heritage-whisper-files bucket
      const { data, error } = await supabaseAdmin.storage
        .from('heritage-whisper-files')
        .createSignedUrl(photoUrl.startsWith('photo/') ? photoUrl : `photo/${photoUrl}`, 604800); // 1 week in seconds

      if (error) {
        console.error('Error creating signed URL for photo:', photoUrl, error);
        // Fallback to public URL
        const { data: publicData } = supabaseAdmin.storage
          .from('heritage-whisper-files')
          .getPublicUrl(photoUrl.startsWith('photo/') ? photoUrl : `photo/${photoUrl}`);
        return publicData?.publicUrl || null;
      }

      return data?.signedUrl || null;
    };

    // Process photos array to add signed URLs
    const photosWithUrls = await Promise.all(
      (updatedStory.photos || []).map(async (photo: any) => ({
        ...photo,
        url: await getPhotoUrl(photo.url)
      }))
    );
    const filteredPhotos = photosWithUrls.filter((photo: any) => photo.url !== null);

    // Process legacy photoUrl if exists
    const publicPhotoUrl = updatedStory.photoUrl ? await getPhotoUrl(updatedStory.photoUrl) : undefined;

    // Transform the response (fields already in camelCase from Drizzle)
    const transformedStory = {
      id: updatedStory.id,
      title: updatedStory.title,
      content: updatedStory.content || updatedStory.transcription,
      createdAt: updatedStory.createdAt,
      updatedAt: updatedStory.updatedAt,
      age: updatedStory.age || updatedStory.lifeAge,
      year: updatedStory.storyYear,
      storyYear: updatedStory.storyYear,
      includeInTimeline: updatedStory.includeInTimeline,
      includeInBook: updatedStory.includeInBook,
      isFavorite: updatedStory.isFavorite,
      photoUrl: publicPhotoUrl,
      hasPhotos: updatedStory.hasPhotos,
      photos: filteredPhotos, // Use photos with signed URLs
      audioUrl: updatedStory.audioUrl,
      transcription: updatedStory.transcription,
      wisdomTranscription: updatedStory.wisdomTranscription || updatedStory.wisdomClipText,
      followUpQuestions: updatedStory.followUpQuestions,
      wisdomClipUrl: updatedStory.wisdomClipUrl,
      durationSeconds: updatedStory.durationSeconds,
      emotions: updatedStory.emotions,
      pivotalCategory: updatedStory.pivotalCategory,
      storyDate: updatedStory.storyDate,
      photoTransform: updatedStory.photoTransform,
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

    // Delete the story from Neon database using Drizzle
    const deletedStories = await db
      .delete(stories)
      .where(and(eq(stories.id, params.id), eq(stories.userId, user.id)))
      .returning();

    if (!deletedStories || deletedStories.length === 0) {
      return NextResponse.json(
        { error: "Story not found or already deleted" },
        { status: 404 }
      );
    }

    // Note: User story count update removed since users are in Neon DB
    // This could be added back using Drizzle if needed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Story deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}