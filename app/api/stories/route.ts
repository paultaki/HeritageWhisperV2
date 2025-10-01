import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, stories, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Initialize Supabase Admin client for token verification
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

    // Fetch real stories from PostgreSQL database (Neon)
    logger.api("Fetching stories for user:", user.id);

    // First, check if user exists in our database
    let dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      logger.api("User not found in database, creating user:", user.id);

      // Create user in database if they don't exist
      try {
        const newUser = await db
          .insert(users)
          .values({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            birthYear: new Date().getFullYear() - 50, // Default birth year
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        dbUser = newUser;
        logger.api("User created in database:", user.id);
      } catch (createError) {
        logger.error("Error creating user:", createError);
        // User might already exist or there's another issue
        // Continue to try fetching stories anyway
      }
    }

    // Fetch stories from the actual PostgreSQL database
    const userStories = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, user.id))
      .orderBy(desc(stories.storyYear), desc(stories.createdAt));

    logger.api("Database response:", {
      storiesCount: userStories.length,
      userId: user.id,
    });

    // Transform snake_case to camelCase for frontend compatibility
    const transformedStories = userStories.map((story) => ({
      id: story.id,
      title: story.title,
      content: story.content,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      age: story.age,
      year: story.storyYear, // Note: database uses storyYear
      storyYear: story.storyYear,
      includeInTimeline: story.includeInTimeline ?? true,
      includeInBook: story.includeInBook ?? true,
      isFavorite: story.isFavorite ?? false,
      photoUrl: story.photoUrl,
      hasPhotos: story.hasPhotos ?? false,
      formattedContent: story.formattedContent,
      photos: story.photos || [],
      audioUrl: story.audioUrl,
      transcription: story.transcription,
      wisdomTranscription: story.wisdomTranscription,
      followUpQuestions: story.followUpQuestions,
    }));

    return NextResponse.json({ stories: transformedStories });
  } catch (error) {
    logger.error("Stories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories", details: error instanceof Error ? error.message : "Unknown error" },
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

    // Save the story to the database
    const [newStory] = await db
      .insert(stories)
      .values({
        userId: user.id,
        title: body.title,
        content: body.content,
        age: body.age,
        storyYear: body.year || body.storyYear,
        includeInTimeline: body.includeInTimeline ?? true,
        includeInBook: body.includeInBook ?? true,
        isFavorite: body.isFavorite ?? false,
        photoUrl: body.photoUrl,
        hasPhotos: body.hasPhotos ?? false,
        formattedContent: body.formattedContent,
        photos: body.photos || [],
        audioUrl: body.audioUrl,
        transcription: body.transcription,
        wisdomTranscription: body.wisdomTranscription,
        followUpQuestions: body.followUpQuestions,
      })
      .returning();

    // Transform the response to camelCase
    const transformedStory = {
      id: newStory.id,
      title: newStory.title,
      content: newStory.content,
      createdAt: newStory.createdAt,
      updatedAt: newStory.updatedAt,
      age: newStory.age,
      year: newStory.storyYear,
      storyYear: newStory.storyYear,
      includeInTimeline: newStory.includeInTimeline,
      includeInBook: newStory.includeInBook,
      isFavorite: newStory.isFavorite,
      photoUrl: newStory.photoUrl,
      hasPhotos: newStory.hasPhotos,
      formattedContent: newStory.formattedContent,
      photos: newStory.photos || [],
      audioUrl: newStory.audioUrl,
      transcription: newStory.transcription,
      wisdomTranscription: newStory.wisdomTranscription,
      followUpQuestions: newStory.followUpQuestions,
    };

    return NextResponse.json({ story: transformedStory });
  } catch (error) {
    logger.error("Story creation error:", error);
    return NextResponse.json(
      { error: "Failed to create story", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}