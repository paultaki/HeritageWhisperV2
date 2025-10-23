import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { pdfshift } from "@/lib/pdfshift";
import { generatePrintToken } from "@/lib/printToken";

export const maxDuration = 60;
export const runtime = "nodejs";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    logger.debug("[Export Trim] Starting PDF export...");

    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // REMOVED: Sensitive data logging - console.log('[Export Trim] No auth token found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // REMOVED: Sensitive data logging - console.log('[Export Trim] Verifying auth token...');
    // Verify the JWT token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.debug("[Export Trim] Auth failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("[Export Trim] Auth successful, user:", user.id);

    // Generate a temporary print token (valid for 5 minutes)
    const printToken = generatePrintToken(user.id);
    logger.debug("[Export Trim] Generated print token for user:", user.id);

    // Use actual domain when deployed
    // PDFShift cannot access localhost - must use publicly accessible URL
    // VERCEL_URL doesn't include protocol
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.heritagewhisper.com';

    // Warn if using localhost (won't work with PDFShift)
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      logger.error('[Export Trim] Cannot use localhost with PDFShift. Set NEXT_PUBLIC_SITE_URL or deploy to test.');
      return NextResponse.json(
        { error: 'PDF export requires a publicly accessible URL. Please deploy to test this feature.' },
        { status: 400 }
      );
    }

    // Use both print token AND userId for maximum compatibility
    // Token for validation, userId for direct access
    const printUrl = `${baseUrl}/book/print/trim?printToken=${printToken}&userId=${user.id}`;
    logger.debug("[Export Trim] Generating PDF from:", printUrl.replace(printToken, 'TOKEN_REDACTED'));

    // Use PDFShift to generate PDF
    const pdf = await pdfshift.convertUrl({
      url: printUrl,
      landscape: false, // Portrait for 5.5x8.5 trim size
      width: "5.5in",
      height: "8.5in",
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      delay: 3000, // Wait 3s for React to hydrate and render
      timeout: 60000, // 60s max timeout for large books
    });

    logger.debug("[Export Trim] PDF generated successfully");

    // Track PDF export
    try {
      await supabaseAdmin.rpc('increment_pdf_export', { user_id: user.id });
    } catch (trackError) {
      // Don't fail the export if tracking fails
      logger.error("[Export Trim] Failed to track export:", trackError);
    }

    logger.debug("[Export Trim] Success! Returning PDF");
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="heritage-book-trim.pdf"`,
      },
    });
  } catch (error) {
    logger.error("[Export Trim] PDF generation error:", error);
    logger.error(
      "[Export Trim] Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
