import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, familyMembers } from "@/lib/db";
import { eq, and } from "drizzle-orm";

import { getPasskeySession } from "@/lib/iron-session";
// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// DELETE /api/family/members/[id] - Remove a family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Verify the JWT token with Supabase
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }
      userId = user.id;
    }

    const memberId = params.id;

    logger.api("Removing family member:", memberId, "for user:", userId);

    // Delete the family member (only if it belongs to the user)
    const deletedMembers = await db
      .delete(familyMembers)
      .where(
        and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)),
      )
      .returning();

    if (deletedMembers.length === 0) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Family member removal error:", error);
    return NextResponse.json(
      {
        error: "Failed to remove family member",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
