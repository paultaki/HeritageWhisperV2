import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: NextRequest) {
    try {
        const { chapterIds } = await request.json();
        if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
            return NextResponse.json({ error: "Invalid chapter IDs" }, { status: 400 });
        }

        const authHeader = request.headers.get("authorization");
        const token = authHeader?.split(" ")[1];
        if (!token) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
        }

        const userId = user.id;
        const updates = chapterIds.map((id, index) => ({ id, orderIndex: index }));

        // Verify ownership
        const userChapters = await db
            .select()
            .from(chapters)
            .where(eq(chapters.userId, userId));

        if (userChapters.length !== chapterIds.length) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Apply updates
        for (const update of updates) {
            await db.update(chapters)
                .set({ orderIndex: update.orderIndex })
                .where(eq(chapters.id, update.id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder chapters error:", error);
        return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
    }
}
