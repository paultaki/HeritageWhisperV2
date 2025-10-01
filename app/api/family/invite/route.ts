import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db, familyMembers } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// Initialize Supabase Admin client for token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// POST /api/family/invite - Invite a family member
export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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
        { status: 401 }
      );
    }

    const { email, relationship, customMessage } = await request.json();

    if (!email || !relationship) {
      return NextResponse.json(
        { error: "Email and relationship are required" },
        { status: 400 }
      );
    }

    logger.api("Inviting family member:", email, "for user:", user.id);

    // Check if already invited
    const existingMember = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.userId, user.id),
          eq(familyMembers.email, email)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: "This person has already been invited" },
        { status: 400 }
      );
    }

    // Create the invitation
    const [newMember] = await db
      .insert(familyMembers)
      .values({
        userId: user.id,
        email,
        relationship,
        customMessage,
        status: "pending",
        permissions: {
          canView: true,
          canComment: true,
          canDownload: false,
        },
      })
      .returning();

    // TODO: Send email invitation
    // await sendInvitationEmail(email, user.name, customMessage);

    return NextResponse.json({
      success: true,
      member: newMember,
    });

  } catch (error) {
    logger.error("Family invitation error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
