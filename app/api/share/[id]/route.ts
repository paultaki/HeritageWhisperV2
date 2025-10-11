import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { sharedAccess } from "@/shared/schema";
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

// PATCH /api/share/[id] - Update share permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const body = await request.json();
    const { permissionLevel, expiresAt, isActive } = body;

    // Verify user owns this share
    const [share] = await db
      .select()
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.id, params.id),
          eq(sharedAccess.ownerUserId, user.id),
        ),
      )
      .limit(1);

    if (!share) {
      return NextResponse.json(
        { error: "Share not found or access denied" },
        { status: 404 },
      );
    }

    // Build update object
    const updates: any = {};
    if (permissionLevel !== undefined) {
      if (!["view", "edit"].includes(permissionLevel)) {
        return NextResponse.json(
          { error: "Permission level must be 'view' or 'edit'" },
          { status: 400 },
        );
      }
      updates.permissionLevel = permissionLevel;
    }
    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    // Update share
    const [updatedShare] = await db
      .update(sharedAccess)
      .set(updates)
      .where(eq(sharedAccess.id, params.id))
      .returning();

    return NextResponse.json({ share: updatedShare });
  } catch (error) {
    logger.error("Error updating share:", error);
    return NextResponse.json(
      { error: "Failed to update share" },
      { status: 500 },
    );
  }
}

// DELETE /api/share/[id] - Revoke share access
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Verify user owns this share
    const [share] = await db
      .select()
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.id, params.id),
          eq(sharedAccess.ownerUserId, user.id),
        ),
      )
      .limit(1);

    if (!share) {
      return NextResponse.json(
        { error: "Share not found or access denied" },
        { status: 404 },
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(sharedAccess)
      .set({ isActive: false })
      .where(eq(sharedAccess.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting share:", error);
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 },
    );
  }
}
