import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Current versions of legal documents
export const CURRENT_TERMS_VERSION = "1.0";
export const CURRENT_PRIVACY_VERSION = "1.0";

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // Get user's accepted versions from database
    const [userRecord] = await db
      .select({
        latestTermsVersion: users.latestTermsVersion,
        latestPrivacyVersion: users.latestPrivacyVersion,
      })
      .from(users)
      .where(eq(users.id, user.id));

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user needs to accept current versions
    const needsTermsAcceptance = userRecord.latestTermsVersion !== CURRENT_TERMS_VERSION;
    const needsPrivacyAcceptance = userRecord.latestPrivacyVersion !== CURRENT_PRIVACY_VERSION;

    return NextResponse.json({
      currentVersions: {
        terms: CURRENT_TERMS_VERSION,
        privacy: CURRENT_PRIVACY_VERSION,
      },
      userVersions: {
        terms: userRecord.latestTermsVersion || null,
        privacy: userRecord.latestPrivacyVersion || null,
      },
      needsAcceptance: {
        terms: needsTermsAcceptance,
        privacy: needsPrivacyAcceptance,
        any: needsTermsAcceptance || needsPrivacyAcceptance,
      },
      isCompliant: !needsTermsAcceptance && !needsPrivacyAcceptance,
    });
  } catch (error) {
    console.error("[Agreements] Error checking status:", error);
    return NextResponse.json(
      { error: "Failed to check agreement status" },
      { status: 500 }
    );
  }
}
