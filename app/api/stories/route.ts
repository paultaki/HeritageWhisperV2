import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, stories, users } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";

// Initialize Supabase Admin client (for auth and storage only)
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

    // Fetch stories from Neon database using Drizzle
    const storiesData = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, user.id))
      .orderBy(desc(stories.storyYear), desc(stories.createdAt));

    if (!storiesData) {
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 }
      );
    }

    // Helper function to generate public URLs for photos
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
      // Using signed URLs instead of public URLs for better security
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

    // Transform snake_case to camelCase for frontend compatibility
    // Also generate public URLs for all photos
    const transformedStories = await Promise.all((storiesData || []).map(async (story) => {
      // Process photos array to add public URLs and filter out invalid ones
      const photosWithUrls = await Promise.all(
        (story.photos || []).map(async (photo: any) => ({
          ...photo,
          url: await getPhotoUrl(photo.url)
        }))
      );
      const filteredPhotos = photosWithUrls.filter((photo: any) => photo.url !== null);

      // Process legacy photoUrl if exists
      const publicPhotoUrl = story.photoUrl ? await getPhotoUrl(story.photoUrl) : undefined;

      return {
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
        photoUrl: publicPhotoUrl,
        hasPhotos: story.hasPhotos ?? false,
        photos: filteredPhotos,
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
    }));

    return NextResponse.json({ stories: transformedStories });
  } catch (error) {
    console.error("Stories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
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


    // First, ensure user exists in Neon database
    // Only select columns we know exist
    try {
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, user.id));

      if (existingUsers.length === 0) {
        try {
          // Create user if doesn't exist - only with required fields
          await db.insert(users).values({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || 'User',
            birthYear: 1950, // Default value, should be updated in profile
          });
        } catch (insertError: any) {
          // If email already exists with different ID, update it
          if (insertError?.cause?.code === '23505' && user.email) {
            console.log("User exists with different ID, updating...");
            await db
              .update(users)
              .set({ id: user.id })
              .where(eq(users.email, user.email));
          } else {
            throw insertError;
          }
        }
      }
    } catch (error) {
      console.warn("User check/creation skipped - table might not exist:", error);
      // Continue anyway - story might still save if FK constraint is not enforced
    }

    // Save the story to Neon database using Drizzle
    const [newStory] = await db
      .insert(stories)
      .values({
        userId: user.id,
        title: body.title,
        transcription: body.transcription || body.content,
        lifeAge: body.lifeAge || body.age,
        storyYear: body.year || body.storyYear,
        includeInTimeline: body.includeInTimeline ?? true,
        includeInBook: body.includeInBook ?? true,
        isFavorite: body.isFavorite ?? false,
        photoUrl: body.photoUrl && !body.photoUrl.startsWith('blob:') ? body.photoUrl : undefined,
        photos: processedPhotos,
        audioUrl: body.audioUrl && !body.audioUrl.startsWith('blob:') ? body.audioUrl : undefined,
        wisdomClipText: body.wisdomClipText || body.wisdomTranscription,
        wisdomClipUrl: body.wisdomClipUrl,
        durationSeconds: body.durationSeconds || 0,
        emotions: body.emotions,
        pivotalCategory: body.pivotalCategory,
        storyDate: body.storyDate,
        photoTransform: body.photoTransform,
      })
      .returning();

    if (!newStory) {
      console.error("Error creating story");
      return NextResponse.json(
        { error: "Failed to create story" },
        { status: 500 }
      );
    }

    // Note: User story count update removed since users are in Neon DB
    // This could be added back using Drizzle if needed

    // Helper function to generate signed URLs for photos (same as in GET)
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
      (newStory.photos || []).map(async (photo: any) => ({
        ...photo,
        url: await getPhotoUrl(photo.url)
      }))
    );
    const filteredPhotos = photosWithUrls.filter((photo: any) => photo.url !== null);

    // Process legacy photoUrl if exists
    const publicPhotoUrl = newStory.photoUrl ? await getPhotoUrl(newStory.photoUrl) : undefined;

    // Transform the response to camelCase (fields already in camelCase from Drizzle)
    const transformedStory = {
      id: newStory.id,
      title: newStory.title,
      content: newStory.content || newStory.transcription,
      createdAt: newStory.createdAt,
      updatedAt: newStory.updatedAt,
      age: newStory.age || newStory.lifeAge,
      year: newStory.storyYear,
      storyYear: newStory.storyYear,
      includeInTimeline: newStory.includeInTimeline,
      includeInBook: newStory.includeInBook,
      isFavorite: newStory.isFavorite,
      photoUrl: publicPhotoUrl,
      hasPhotos: newStory.hasPhotos,
      formattedContent: newStory.formattedContent,
      photos: filteredPhotos, // Use photos with signed URLs
      audioUrl: newStory.audioUrl,
      transcription: newStory.transcription,
      wisdomTranscription: newStory.wisdomTranscription || newStory.wisdomClipText,
      followUpQuestions: newStory.followUpQuestions,
      wisdomClipUrl: newStory.wisdomClipUrl,
      durationSeconds: newStory.durationSeconds,
      emotions: newStory.emotions,
      pivotalCategory: newStory.pivotalCategory,
      storyDate: newStory.storyDate,
      photoTransform: newStory.photoTransform,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    console.error("Story creation error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}