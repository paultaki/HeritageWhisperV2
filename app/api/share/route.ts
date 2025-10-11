import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { sharedAccess } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET /api/share - List all shares created by current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Get all shares created by this user
    const shares = await db
      .select()
      .from(sharedAccess)
      .where(eq(sharedAccess.ownerUserId, user.id));

    return NextResponse.json({ shares });
  } catch (error) {
    logger.error("Error fetching shares:", error);
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    );
  }
}

// POST /api/share - Create a new share
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, permissionLevel, expiresAt } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (permissionLevel && !["view", "edit"].includes(permissionLevel)) {
      return NextResponse.json(
        { error: "Permission level must be 'view' or 'edit'" },
        { status: 400 }
      );
    }

    // Check if share already exists for this email
    const existingShare = await db
      .select()
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.ownerUserId, user.id),
          eq(sharedAccess.sharedWithEmail, email.toLowerCase()),
          eq(sharedAccess.isActive, true)
        )
      )
      .limit(1);

    if (existingShare.length > 0) {
      return NextResponse.json(
        { error: "This email already has access to your timeline" },
        { status: 400 }
      );
    }

    // Generate unique share token
    const shareToken = nanoid(32);

    // Create share
    const [newShare] = await db
      .insert(sharedAccess)
      .values({
        ownerUserId: user.id,
        sharedWithEmail: email.toLowerCase(),
        permissionLevel: permissionLevel || "view",
        shareToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    // Generate share link
    const shareUrl = `${request.nextUrl.origin}/shared/${shareToken}`;

    return NextResponse.json({
      share: newShare,
      shareUrl,
    });
  } catch (error) {
    logger.error("Error creating share:", error);
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    );
  }
}
