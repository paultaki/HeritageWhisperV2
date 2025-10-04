import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { userAgreements, users } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Current versions of legal documents
export const CURRENT_TERMS_VERSION = "1.0";
export const CURRENT_PRIVACY_VERSION = "1.0";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { agreementType, version, method = "reacceptance" } = body;

    // Validate input
    if (!agreementType || !version) {
      return NextResponse.json(
        { error: "agreementType and version are required" },
        { status: 400 }
      );
    }

    if (!["terms", "privacy"].includes(agreementType)) {
      return NextResponse.json(
        { error: "agreementType must be 'terms' or 'privacy'" },
        { status: 400 }
      );
    }

    if (!["signup", "reacceptance", "oauth"].includes(method)) {
      return NextResponse.json(
        { error: "method must be 'signup', 'reacceptance', or 'oauth'" },
        { status: 400 }
      );
    }

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") ||
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Record the agreement acceptance
    const [agreement] = await db.insert(userAgreements).values({
      userId: user.id,
      agreementType,
      version,
      ipAddress,
      userAgent,
      method,
    }).returning();

    // Update the user's latest version field for quick lookups
    const updateField = agreementType === "terms"
      ? { latestTermsVersion: version }
      : { latestPrivacyVersion: version };

    await db
      .update(users)
      .set(updateField)
      .where(eq(users.id, user.id));

    console.log(`[Agreements] User ${user.id} accepted ${agreementType} v${version} via ${method}`);

    return NextResponse.json({
      success: true,
      agreement: {
        id: agreement.id,
        userId: agreement.userId,
        agreementType: agreement.agreementType,
        version: agreement.version,
        acceptedAt: agreement.acceptedAt,
        method: agreement.method,
      },
    });
  } catch (error) {
    console.error("[Agreements] Error recording acceptance:", error);
    return NextResponse.json(
      { error: "Failed to record agreement acceptance" },
      { status: 500 }
    );
  }
}
