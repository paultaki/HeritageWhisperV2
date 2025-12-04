import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters } from "@/shared/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * POST /api/chapters/reorder
 * Reorder chapters by updating their orderIndex values
 *
 * Performance: Uses single batch UPDATE with CASE statement
 * (was: N separate UPDATE queries in a loop)
 */
export async function POST(request: NextRequest) {
  try {
    const { chapterIds } = await request.json();
    if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid chapter IDs" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Verify ownership - all chapters must belong to user
    const userChapters = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.userId, userId));

    const userChapterIds = new Set(userChapters.map((c) => c.id));
    const allOwned = chapterIds.every((id) => userChapterIds.has(id));

    if (!allOwned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build CASE statement for batch update
    // UPDATE chapters SET order_index = CASE
    //   WHEN id = 'id1' THEN 0
    //   WHEN id = 'id2' THEN 1
    //   ...
    // END
    // WHERE id IN ('id1', 'id2', ...)
    const caseStatements = chapterIds.map(
      (id, index) => sql`WHEN ${chapters.id} = ${id} THEN ${index}`
    );

    await db
      .update(chapters)
      .set({
        orderIndex: sql`CASE ${sql.join(caseStatements, sql` `)} END`,
      })
      .where(inArray(chapters.id, chapterIds));

    logger.debug(
      `[Chapters] Reordered ${chapterIds.length} chapters for user ${userId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[Chapters] Reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
