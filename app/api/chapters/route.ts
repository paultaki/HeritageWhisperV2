import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters, stories } from "@/shared/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
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
                console.log("[API] No token provided");
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }

            console.log(`[API] Verifying token: ${token.substring(0, 10)}...${token.substring(token.length - 5)} (Length: ${token.length})`);

            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (error || !user) {
                console.error("[API] Auth error:", error);
                return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
            }
            userId = user.id;
        }

        // Get storyteller_id for family sharing (default to authenticated user)
        const { searchParams } = new URL(request.url);
        const storytellerId = searchParams.get("storyteller_id") || userId;

        // Check family sharing access if viewing another user's chapters
        if (storytellerId !== userId) {
            const { data: hasAccess } = await supabaseAdmin.rpc(
                "has_collaboration_access",
                {
                    p_user_id: userId,
                    p_storyteller_id: storytellerId,
                }
            );

            if (!hasAccess) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 }
                );
            }
        }

        const userChapters = await db.query.chapters.findMany({
            where: eq(chapters.userId, storytellerId),
            orderBy: [asc(chapters.orderIndex)],
            with: {
                stories: {
                    orderBy: [asc(stories.chapterOrderIndex)],
                }
            }
        });

        // Fetch orphaned stories (stories without a chapter)
        const orphanedStories = await db.query.stories.findMany({
            where: (stories, { and, eq, isNull }) => and(
                eq(stories.userId, storytellerId),
                isNull(stories.chapterId)
            ),
            orderBy: [asc(stories.storyDate)] // Default to chronological for unorganized
        });

        return NextResponse.json({ chapters: userChapters, orphanedStories });
    } catch (error) {
        // Chapters feature not yet implemented - return empty data gracefully
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Catch various error formats for missing chapters table
        if (errorMessage.includes('relation "chapters" does not exist') ||
            errorMessage.includes('does not exist in the schema cache') ||
            errorMessage.includes('Failed query') && errorMessage.includes('"chapters"')) {
            logger.debug("Chapters table not yet created - returning empty data");
            return NextResponse.json({ chapters: [], orphanedStories: [] });
        }
        logger.error("Chapters fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch chapters", details: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }

            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (error || !user) {
                return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
            }
            userId = user.id;
        }

        const body = await request.json();
        const { title } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Get max order index
        const existingChapters = await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.userId, userId));
        const orderIndex = existingChapters.length;

        const [newChapter] = await db.insert(chapters).values({
            userId: userId,
            title,
            orderIndex,
        }).returning();

        return NextResponse.json({ chapter: newChapter });
    } catch (error) {
        logger.error("Create chapter error:", error);
        return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
    }
}
