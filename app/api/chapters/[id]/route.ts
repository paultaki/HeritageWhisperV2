import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { chapters } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;
        const body = await request.json();
        const { title, orderIndex } = body;

        const [updatedChapter] = await db.update(chapters)
            .set({
                ...(title && { title }),
                ...(orderIndex !== undefined && { orderIndex }),
            })
            .where(and(eq(chapters.id, id), eq(chapters.userId, user.id)))
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
        const authHeader = request.headers.get("authorization");
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
        }

        const { id } = await params;

        const [deletedChapter] = await db.delete(chapters)
            .where(and(eq(chapters.id, id), eq(chapters.userId, user.id)))
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
