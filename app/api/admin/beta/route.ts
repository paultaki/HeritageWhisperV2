/**
 * GET /api/admin/beta
 *
 * Fetches all beta codes with their associated user emails.
 * Admin-only endpoint for the beta codes management dashboard.
 *
 * SECURITY:
 * - Uses supabaseAdmin to bypass RLS (admin needs to see all codes)
 * - Should be protected by admin auth middleware in production
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logger } from "@/lib/logger";
import { getPasskeySession } from "@/lib/iron-session";

export async function GET(request: NextRequest) {
  try {
    // 1. Validate admin session
    // TODO: Add proper admin role check once admin roles are implemented
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    let userId: string | undefined;

    // Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else if (token) {
      // Fall back to JWT auth
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
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // TODO: Check if user has admin role
    // For now, any authenticated user can access (should be restricted in production)

    // 2. Fetch all beta codes with user emails
    const { data: codesData, error: codesError } = await supabaseAdmin
      .from("beta_codes")
      .select(
        `
        *,
        issued_to:issued_to_user_id(email),
        used_by:used_by_user_id(email)
      `
      )
      .order("created_at", { ascending: false });

    if (codesError) {
      logger.error("Error fetching beta codes:", codesError);
      return NextResponse.json(
        { error: "Failed to fetch beta codes" },
        { status: 500 }
      );
    }

    // 3. Transform data to include emails at top level
    const codes = (codesData || []).map((code: any) => ({
      id: code.id,
      code: code.code,
      issuedToUserId: code.issued_to_user_id,
      issuedToEmail: code.issued_to?.email || null,
      usedByUserId: code.used_by_user_id,
      usedByEmail: code.used_by?.email || null,
      createdAt: code.created_at,
      usedAt: code.used_at,
      expiresAt: code.expires_at,
      revoked: code.revoked,
    }));

    return NextResponse.json({ codes });
  } catch (error) {
    logger.error("Error in GET /api/admin/beta:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
