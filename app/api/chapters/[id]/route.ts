import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getPasskeySession } from "@/lib/iron-session";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // 1. Try session-based auth (primary)
        const session = await getPasskeySession();
        let userId = session?.userId;

        // 2. Fallback to Supabase token (secondary)
        if (!userId) {
            const authHeader = request.headers.get("authorization");
            const token = authHeader && authHeader.split(" ")[1];

            if (token) {
                const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                if (!error && user) {
                    userId = user.id;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { title, orderIndex } = body;

        const [updatedChapter] = await db.update(chapters)
            .set({
                ...(title && { title }),
                ...(orderIndex !== undefined && { orderIndex }),
            })
            .where(and(eq(chapters.id, id), eq(chapters.userId, userId)))
            .returning();

        if (!updatedChapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        return NextResponse.json({ chapter: updatedChapter });
    } catch (error) {
        logger.error("Update chapter error:", error);
        return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // 1. Try session-based auth (primary)
        const session = await getPasskeySession();
        let userId = session?.userId;

        // 2. Fallback to Supabase token (secondary)
        if (!userId) {
            const authHeader = request.headers.get("authorization");
            const token = authHeader && authHeader.split(" ")[1];

            if (token) {
                const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                if (!error && user) {
                    userId = user.id;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { id } = await params;

        // Note: stories.chapterId has ON DELETE SET NULL, so stories will automatically be unlinked.
        const [deletedChapter] = await db.delete(chapters)
            .where(and(eq(chapters.id, id), eq(chapters.userId, userId)))
            .returning();

        if (!deletedChapter) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Delete chapter error:", error);
        return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
    }
}
