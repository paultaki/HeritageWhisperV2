/**
 * Passkey Management API
 *
 * GET /api/passkey/manage - List all passkeys for authenticated user
 * DELETE /api/passkey/manage - Delete a specific passkey
 * PATCH /api/passkey/manage - Update passkey friendly name
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getUserPasskeys,
  deletePasskey,
  updatePasskeyName,
} from "@/lib/db-admin";
import { getPasskeySession } from "@/lib/iron-session";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Helper: Get authenticated user ID from either passkey session or Supabase session
 */
async function getAuthenticatedUserId(
  request: NextRequest
): Promise<string | null> {
  // Try passkey session first
  const passkeySession = await getPasskeySession();
  if (passkeySession) {
    return passkeySession.userId;
  }

  // Fall back to Supabase session
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id || null;
}

/**
 * GET - List all passkeys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from either session type
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all passkeys for this user
    const passkeys = await getUserPasskeys(userId);

    return NextResponse.json({
      passkeys: passkeys.map((pk) => ({
        id: pk.id,
        friendlyName: pk.friendlyName,
        credentialDeviceType: pk.credentialDeviceType,
        credentialBackedUp: pk.credentialBackedUp,
        createdAt: pk.createdAt,
        lastUsedAt: pk.lastUsedAt,
      })),
    });
  } catch (error) {
    logger.error(
      "[manage:GET] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to fetch passkeys" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a passkey
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from either session type
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { passkeyId } = await request.json();

    if (!passkeyId) {
      return NextResponse.json(
        { error: "Passkey ID required" },
        { status: 400 }
      );
    }

    // Delete the passkey (includes ownership check)
    const success = await deletePasskey(userId, passkeyId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete passkey" },
        { status: 500 }
      );
    }

    logger.info("[manage:DELETE] Passkey deleted", {
      userId,
      passkeyId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "[manage:DELETE] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to delete passkey" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update passkey friendly name
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user ID from either session type
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { passkeyId, friendlyName } = await request.json();

    if (!passkeyId || !friendlyName) {
      return NextResponse.json(
        { error: "Passkey ID and friendly name required" },
        { status: 400 }
      );
    }

    // Update the passkey name (includes ownership check)
    const success = await updatePasskeyName(userId, passkeyId, friendlyName);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update passkey name" },
        { status: 500 }
      );
    }

    logger.info("[manage:PATCH] Passkey name updated", {
      userId,
      passkeyId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "[manage:PATCH] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to update passkey name" },
      { status: 500 }
    );
  }
}
