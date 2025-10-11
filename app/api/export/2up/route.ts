import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

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
    logger.debug("[Export 2up] Starting PDF export...");

    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // REMOVED: Sensitive data logging - console.log('[Export 2up] No auth token found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // REMOVED: Sensitive data logging - console.log('[Export 2up] Verifying auth token...');
    // Verify the JWT token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.debug("[Export 2up] Auth failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("[Export 2up] Auth successful, user:", user.id);

    const { bookId } = await request.json();

    logger.debug("[Export 2up] Launching browser...");
    logger.debug("[Export 2up] Environment:", process.env.NODE_ENV);
    logger.debug("[Export 2up] Platform:", process.platform);

    // Use local Chrome for development, @sparticuz/chromium for production
    const isDev = process.env.NODE_ENV === "development";

    let executablePath;
    if (isDev) {
      executablePath =
        process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : undefined;
    } else {
      executablePath = await chromium.executablePath();
      logger.debug("[Export 2up] Chromium path:", executablePath);
    }

    const launchArgs = isDev
      ? ["--no-sandbox"]
      : [...chromium.args, "--disable-gpu", "--no-zygote", "--single-process"];

    logger.debug("[Export 2up] Launch args:", launchArgs.join(" "));

    const browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    logger.debug("[Export 2up] Browser launched, creating new page...");
    const page = await browser.newPage();

    // Set viewport to match print dimensions at 96 DPI
    await page.setViewport({
      width: 1056, // 11 inches × 96 DPI
      height: 816, // 8.5 inches × 96 DPI
      deviceScaleFactor: 1,
    });

    // Log all network requests
    page.on("request", (request) => {
      logger.debug("[Export 2up] Request:", request.method(), request.url());
    });

    page.on("requestfailed", (request) => {
      logger.error(
        "[Export 2up] Request failed:",
        request.url(),
        request.failure()?.errorText,
      );
    });

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/") || url.includes("/book/")) {
        logger.debug("[Export 2up] Response:", response.status(), url);
      }
    });

    // Use actual domain when deployed, localhost for dev
    // VERCEL_URL doesn't include protocol, and we need the actual deployment URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ||
        `http://127.0.0.1:${process.env.PORT || 3002}`;

    const printUrl = `${baseUrl}/book/print/2up?userId=${user.id}`;
    logger.debug("[Export 2up] Navigating to:", printUrl);

    try {
      // Use 'load' instead of 'networkidle0' for faster, more reliable rendering
      await page.goto(printUrl, { waitUntil: "load", timeout: 60000 });
      logger.debug("[Export 2up] Initial page load complete");
    } catch (navError) {
      logger.debug("[Export 2up] Navigation error:", navError);
      logger.debug("[Export 2up] Trying with localhost fallback...");
      // Fallback to localhost if primary URL fails
      const fallbackUrl = `http://localhost:${process.env.PORT || 3002}/book/print/2up?userId=${user.id}`;
      await page.goto(fallbackUrl, { waitUntil: "load", timeout: 60000 });
      logger.debug("[Export 2up] Fallback navigation complete");
    }

    logger.debug("[Export 2up] Page loaded, waiting for content...");

    // Check for errors on the page
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        logger.error("[Export 2up] Page error:", text);
        pageErrors.push(text);
      } else {
        logger.debug("[Export 2up] Page log:", text);
      }
    });

    page.on("pageerror", (error) => {
      logger.error("[Export 2up] Page exception:", error);
    });

    // Wait for React to hydrate and render content
    // Use a custom wait function that checks for actual content, not just the container
    try {
      logger.debug("[Export 2up] Waiting for React hydration...");

      await page.waitForFunction(
        () => {
          const spread = document.querySelector(".book-spread");
          if (!spread) return false;

          // Check if spread has actual content (not just loading state)
          const hasContent = spread.querySelector(".page") !== null;
          const notLoading = !document.body.innerText.includes("Loading");

          return hasContent && notLoading;
        },
        { timeout: 45000, polling: 500 },
      );

      logger.debug("[Export 2up] Content detected, waiting for images...");

      // Wait for images to load
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve) => {
                  img.onload = img.onerror = resolve;
                }),
            ),
        );
      });

      // Additional wait for any async rendering
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000)),
      );

      logger.debug("[Export 2up] All content loaded");
    } catch (waitError) {
      // Take a screenshot for debugging
      const screenshot = await page.screenshot({
        encoding: "base64",
        fullPage: true,
      });
      logger.error("[Export 2up] Failed to render content");
      logger.error("[Export 2up] Page errors:", pageErrors);
      logger.error(
        "[Export 2up] Screenshot (base64):",
        screenshot.substring(0, 100) + "...",
      );

      // Get the page HTML to see what's actually there
      const html = await page.content();
      logger.error(
        "[Export 2up] Page HTML (first 2000 chars):",
        html.substring(0, 2000),
      );

      // Check network activity
      const metrics = await page.metrics();
      logger.error("[Export 2up] Page metrics:", metrics);

      throw new Error(
        `Failed to render book content: ${waitError instanceof Error ? waitError.message : String(waitError)}`,
      );
    }

    // Debug: Log the actual HTML to see what's being rendered
    try {
      const html = await page.evaluate(() => {
        const firstSpread = document.querySelector(".book-spread");
        if (firstSpread) {
          const computed = window.getComputedStyle(firstSpread);
          return {
            width: computed.width,
            height: computed.height,
            display: computed.display,
            html: document
              .querySelector(".print-2up")
              ?.outerHTML?.substring(0, 500),
          };
        }
        return { html: "No .book-spread found" };
      });
      logger.debug(
        "[Export 2up] Page diagnostics:",
        JSON.stringify(html, null, 2),
      );
    } catch (evalError) {
      logger.error("[Export 2up] Evaluation error:", evalError);
    }

    logger.debug("[Export 2up] Content loaded, generating PDF...");
    const pdf = await page.pdf({
      width: "11in",
      height: "8.5in",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false, // Use our explicit dimensions, not CSS @page
    });

    logger.debug("[Export 2up] PDF generated, closing browser...");
    await browser.close();

    logger.debug("[Export 2up] Success! Returning PDF");

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="heritage-book-2up.pdf"`,
      },
    });
  } catch (error) {
    logger.error("[Export 2up] PDF generation error:", error);
    logger.error(
      "[Export 2up] Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
