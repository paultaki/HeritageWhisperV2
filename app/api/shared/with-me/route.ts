import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { sharedAccess, users } from "@/shared/schema";
import { eq, and, or } from "drizzle-orm";
import { logger } from "@/lib/logger";

import { getPasskeySession } from "@/lib/iron-session";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET /api/shared/with-me - Get all timelines shared with current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Find all active shares where current user is the recipient (by email or userId)
    const shares = await db
      .select({
        share: sharedAccess,
        owner: users,
      })
      .from(sharedAccess)
      .leftJoin(users, eq(sharedAccess.ownerUserId, users.id))
      .where(
        and(
          or(
            eq(sharedAccess.sharedWithEmail, user.email || ""),
            eq(sharedAccess.sharedWithUserId, userId),
          ),
          eq(sharedAccess.isActive, true),
        ),
      );

    // Filter out expired shares and format response
    const validShares = shares
      .filter(({ share }) => {
        if (!share.expiresAt) return true;
        return new Date(share.expiresAt) > new Date();
      })
      .map(({ share, owner }) => ({
        shareToken: share.shareToken,
        permissionLevel: share.permissionLevel,
        owner: {
          id: owner?.id,
          name: owner?.name,
          birthYear: owner?.birthYear,
        },
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        lastAccessedAt: share.lastAccessedAt,
      }));

    return NextResponse.json({ shares: validShares });
  } catch (error) {
    logger.error("Error fetching shared timelines:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared timelines" },
      { status: 500 },
    );
  }
}
