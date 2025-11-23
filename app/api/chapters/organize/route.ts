import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { chapters, stories } from "@/shared/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { suggestChapters } from "@/lib/chapterOrganization";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

import { getPasskeySession } from "@/lib/iron-session";

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

        // Fetch all stories for the user
        logger.info(`[Organize] Fetching stories for user ${userId}`);
        const userStories = await db.select().from(stories).where(eq(stories.userId, userId));

        if (userStories.length === 0) {
            logger.warn(`[Organize] No stories found for user ${userId}`);
            return NextResponse.json({ error: "No stories to organize" }, { status: 400 });
        }

        logger.info(`[Organize] Found ${userStories.length} stories. Calling AI suggestion...`);

        // Get AI suggestions
        let suggestions;
        try {
            suggestions = await suggestChapters(userStories);
            logger.info(`[Organize] AI returned ${suggestions.length} chapters`);
        } catch (aiError) {
            logger.error("[Organize] AI suggestion failed:", aiError);
            return NextResponse.json({ error: "AI organization failed" }, { status: 500 });
        }

        // Apply suggestions in a transaction
        await db.transaction(async (tx) => {
            logger.info(`[Organize] Starting transaction to apply changes`);
            // Delete existing chapters (stories will be unlinked via ON DELETE SET NULL)
            await tx.delete(chapters).where(eq(chapters.userId, userId!));

            for (const chapterData of suggestions) {
                const [newChapter] = await tx.insert(chapters).values({
                    userId: userId!,
                    title: chapterData.title,
                    orderIndex: chapterData.orderIndex,
                    isAiGenerated: true,
                }).returning();

                if (chapterData.storyIds.length > 0) {
                    // Update stories one by one to set correct order
                    for (let i = 0; i < chapterData.storyIds.length; i++) {
                        await tx.update(stories)
                            .set({
                                chapterId: newChapter.id,
                                chapterOrderIndex: i
                            })
                            .where(eq(stories.id, chapterData.storyIds[i]));
                    }
                }
            }
            logger.info(`[Organize] Transaction completed successfully`);
        });

        return NextResponse.json({ success: true, count: suggestions.length });
    } catch (error) {
        logger.error("Organize chapters error:", error);
        return NextResponse.json({ error: "Failed to organize chapters" }, { status: 500 });
    }
}
