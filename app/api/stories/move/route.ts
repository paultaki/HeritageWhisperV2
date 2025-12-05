import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories } from "@/shared/schema";
import { eq, inArray, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
        const { updates } = body;

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid updates format" }, { status: 400 });
        }

        // Verify ownership of all stories
        const storyIdsToUpdate = updates.map((u: any) => u.storyId);
        if (storyIdsToUpdate.length > 0) {
            const userStories = await db.select({ id: stories.id }).from(stories)
                .where(and(inArray(stories.id, storyIdsToUpdate), eq(stories.userId, userId)));

            if (userStories.length !== storyIdsToUpdate.length) {
                return NextResponse.json({ error: "Unauthorized access to some stories" }, { status: 403 });
            }

            // Perform updates in transaction
            await db.transaction(async (tx) => {
                for (const update of updates) {
                    await tx.update(stories)
                        .set({
                            chapterId: update.chapterId,
                            chapterOrderIndex: update.orderIndex
                        })
                        .where(eq(stories.id, update.storyId));
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Move stories error:", error);
        return NextResponse.json({ error: "Failed to move stories" }, { status: 500 });
    }
}
