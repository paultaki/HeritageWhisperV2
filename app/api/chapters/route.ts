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

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
        }

        const userChapters = await db.query.chapters.findMany({
            where: eq(chapters.userId, user.id),
            orderBy: [asc(chapters.orderIndex)],
            with: {
                stories: {
                    orderBy: [asc(stories.chapterOrderIndex)],
                }
            }
        });

        return NextResponse.json({ chapters: userChapters });
    } catch (error) {
        logger.error("Chapters fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
        }

        const body = await request.json();
        const { title } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Get max order index
        const existingChapters = await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.userId, user.id));
        const orderIndex = existingChapters.length;

        const [newChapter] = await db.insert(chapters).values({
            userId: user.id,
            title,
            orderIndex,
        }).returning();

        return NextResponse.json({ chapter: newChapter });
    } catch (error) {
        logger.error("Create chapter error:", error);
        return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
    }
}
