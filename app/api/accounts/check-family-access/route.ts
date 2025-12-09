/**
 * Check Family Access API
 *
 * Checks if the current signed-in user has family access to a specific storyteller.
 * This is used when a logged-in subscriber clicks a family timeline link to verify
 * they have access before redirecting them to the main timeline with the correct context.
 *
 * GET /api/accounts/check-family-access?storyteller_id=UUID
 *
 * Returns:
 * - hasAccess: boolean
 * - storytellerName: string (if access granted)
 * - permissionLevel: string (if access granted)
 * - relationship: string | null (if access granted)
 */

import { NextRequest, NextResponse } from "next/server";
import { getPasskeySession } from "@/lib/iron-session";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
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
          { error: "Authentication required", hasAccess: false },
          { status: 401 }
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication", hasAccess: false },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    // Get storyteller_id from query params
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get("storyteller_id");

    if (!storytellerId) {
      return NextResponse.json(
        { error: "storyteller_id is required", hasAccess: false },
        { status: 400 }
      );
    }

    // If user is checking their own account, they always have access
    if (userId === storytellerId) {
      // Get user's name for context
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("name")
        .eq("id", userId)
        .single();

      return NextResponse.json({
        hasAccess: true,
        storytellerName: userData?.name || "Your Stories",
        permissionLevel: "owner",
        relationship: null,
        isOwner: true,
      });
    }

    // Get the current user's email to check family_members
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (userError || !currentUser?.email) {
      logger.error("[CheckFamilyAccess] Failed to get user email:", userError);
      return NextResponse.json({
        hasAccess: false,
        error: "Could not verify user",
      });
    }

    // Check if user has access via family_members table (email match)
    const { data: familyMember, error: familyError } = await supabaseAdmin
      .from("family_members")
      .select(`
        id,
        relationship,
        permission_level,
        users!inner (
          id,
          name
        )
      `)
      .eq("user_id", storytellerId)
      .eq("email", currentUser.email)
      .eq("status", "active")
      .single();

    if (familyError || !familyMember) {
      // Also check using the RPC function for broader access check
      const { data: hasRpcAccess } = await supabaseAdmin.rpc(
        "has_collaboration_access",
        {
          p_user_id: userId,
          p_storyteller_id: storytellerId,
        }
      );

      if (hasRpcAccess) {
        // Get storyteller name
        const { data: storytellerData } = await supabaseAdmin
          .from("users")
          .select("name")
          .eq("id", storytellerId)
          .single();

        return NextResponse.json({
          hasAccess: true,
          storytellerName: storytellerData?.name || "Family Member",
          permissionLevel: "viewer",
          relationship: null,
        });
      }

      return NextResponse.json({
        hasAccess: false,
      });
    }

    // Access granted via family_members
    const storyteller = (familyMember as any).users;

    return NextResponse.json({
      hasAccess: true,
      storytellerName: storyteller?.name || "Family Member",
      permissionLevel: familyMember.permission_level || "viewer",
      relationship: familyMember.relationship,
    });
  } catch (error) {
    logger.error("[CheckFamilyAccess] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", hasAccess: false },
      { status: 500 }
    );
  }
}
