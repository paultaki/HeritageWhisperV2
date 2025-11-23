import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/db";
import { chapters } from "@/shared/schema";
import { supabaseAdmin } from "@/lib/supabase";
import { eq, inArray, and } from "drizzle-orm";
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

        const body = await request.json();
        const { updates } = body; // Array of { id, orderIndex }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid updates format" }, { status: 400 });
        }

        // Verify ownership
        const chapterIds = updates.map((u: any) => u.id);
        if (chapterIds.length > 0) {
            const userChapters = await db.select({ id: chapters.id }).from(chapters)
                .where(and(inArray(chapters.id, chapterIds), eq(chapters.userId, userId)));

            if (userChapters.length !== chapterIds.length) {
                return NextResponse.json({ error: "Unauthorized access to some chapters" }, { status: 403 });
            }
        }

        // Apply updates in transaction
        await db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.update(chapters)
                    .set({ orderIndex: update.orderIndex })
                    .where(eq(chapters.id, update.id));
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder chapters error:", error);
        return NextResponse.json({ error: "Failed to reorder chapters" }, { status: 500 });
    }
}
