import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { sharedAccess, stories, users } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET /api/shared/[token] - Get shared timeline data
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Find share by token
    const [share] = await db
      .select()
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.shareToken, params.token),
          eq(sharedAccess.isActive, true)
        )
      )
      .limit(1);

    if (!share) {
      return NextResponse.json(
        { error: "Share link not found or expired" },
        { status: 404 }
      );
    }

    // Check if share has expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 403 }
      );
    }

    // Update last accessed timestamp
    await db
      .update(sharedAccess)
      .set({ lastAccessedAt: new Date() })
      .where(eq(sharedAccess.id, share.id));

    // Get owner user info
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, share.ownerUserId))
      .limit(1);

    if (!owner) {
      return NextResponse.json(
        { error: "Timeline owner not found" },
        { status: 404 }
      );
    }

    // Get all stories for the owner
    const ownerStories = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, share.ownerUserId));

    // Generate signed URLs for photos and audio
    const storiesWithUrls = await Promise.all(
      ownerStories.map(async (story) => {
        let updatedStory = { ...story };

        // Generate signed URLs for photos
        if (story.photos && story.photos.length > 0) {
          const photosWithUrls = await Promise.all(
            story.photos.map(async (photo) => {
              if (!photo.url || photo.url.startsWith("http")) {
                return photo;
              }

              const { data, error } = await supabaseAdmin.storage
                .from("heritage-whisper-files")
                .createSignedUrl(photo.url, 604800); // 1 week

              if (error) {
                console.error("Error creating signed URL:", error);
                return photo;
              }

              return { ...photo, url: data.signedUrl };
            })
          );
          updatedStory.photos = photosWithUrls;
        }

        // Generate signed URL for audio
        if (story.audioUrl && !story.audioUrl.startsWith("http")) {
          const { data, error } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(story.audioUrl, 604800); // 1 week

          if (!error && data) {
            updatedStory.audioUrl = data.signedUrl;
          }
        }

        return updatedStory;
      })
    );

    return NextResponse.json({
      share: {
        permissionLevel: share.permissionLevel,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
      },
      owner: {
        id: owner.id,
        name: owner.name,
        birthYear: owner.birthYear,
      },
      stories: storiesWithUrls,
    });
  } catch (error) {
    console.error("Error fetching shared timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared timeline" },
      { status: 500 }
    );
  }
}
