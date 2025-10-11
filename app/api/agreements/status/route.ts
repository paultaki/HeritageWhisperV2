import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

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

    // Get user's accepted versions from database using Supabase client
    const { data: userRecord, error: dbError } = await supabase
      .from("users")
      .select("latest_terms_version, latest_privacy_version")
      .eq("id", user.id)
      .single();

    if (dbError || !userRecord) {
      logger.debug('[Agreements] No user record found for', user.id, 'Error:', dbError?.message);

      // Check if user has agreement records in user_agreements table
      const { data: agreements, error: agreementError } = await supabase
        .from("user_agreements")
        .select("agreement_type, version")
        .eq("user_id", user.id);

      if (agreements && agreements.length > 0) {
        // Check if they have both current versions
        const hasTerms = agreements.some(a =>
          a.agreement_type === 'terms' && a.version === CURRENT_TERMS_VERSION
        );
        const hasPrivacy = agreements.some(a =>
          a.agreement_type === 'privacy' && a.version === CURRENT_PRIVACY_VERSION
        );

        if (hasTerms && hasPrivacy) {
          // User has already accepted both agreements, they're compliant
          logger.debug('[Agreements] User has both agreement records - considering compliant');
          return NextResponse.json({
            currentVersions: {
              terms: CURRENT_TERMS_VERSION,
              privacy: CURRENT_PRIVACY_VERSION,
            },
            userVersions: {
              terms: CURRENT_TERMS_VERSION,
              privacy: CURRENT_PRIVACY_VERSION,
            },
            needsAcceptance: {
              terms: false,
              privacy: false,
              any: false,
            },
            isCompliant: true,
          });
        }
      }

      // No agreements found - they need to accept
      return NextResponse.json({
        currentVersions: {
          terms: CURRENT_TERMS_VERSION,
          privacy: CURRENT_PRIVACY_VERSION,
        },
        userVersions: {
          terms: null,
          privacy: null,
        },
        needsAcceptance: {
          terms: true,
          privacy: true,
          any: true,
        },
        isCompliant: false,
      });
    }

    // Check if user needs to accept current versions
    const needsTermsAcceptance = userRecord.latest_terms_version !== CURRENT_TERMS_VERSION;
    const needsPrivacyAcceptance = userRecord.latest_privacy_version !== CURRENT_PRIVACY_VERSION;

    return NextResponse.json({
      currentVersions: {
        terms: CURRENT_TERMS_VERSION,
        privacy: CURRENT_PRIVACY_VERSION,
      },
      userVersions: {
        terms: userRecord.latest_terms_version || null,
        privacy: userRecord.latest_privacy_version || null,
      },
      needsAcceptance: {
        terms: needsTermsAcceptance,
        privacy: needsPrivacyAcceptance,
        any: needsTermsAcceptance || needsPrivacyAcceptance,
      },
      isCompliant: !needsTermsAcceptance && !needsPrivacyAcceptance,
    });
  } catch (error) {
    logger.error("[Agreements] Error checking status:", error);
    return NextResponse.json(
      { error: "Failed to check agreement status" },
      { status: 500 }
    );
  }
}
