import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { chapters, stories } from "@/shared/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

import { getPasskeySession } from "@/lib/iron-session";

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

        const userChapters = await db.query.chapters.findMany({
            where: eq(chapters.userId, userId),
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
                eq(stories.userId, userId),
                isNull(stories.chapterId)
            ),
            orderBy: [asc(stories.storyDate)] // Default to chronological for unorganized
        });

        return NextResponse.json({ chapters: userChapters, orphanedStories });
    } catch (error) {
        logger.error("Chapters fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch chapters", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
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
