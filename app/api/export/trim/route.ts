import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/logger";

export const maxDuration = 60;
export const runtime = 'nodejs';

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    logger.debug('[Export Trim] Starting PDF export...');

    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // REMOVED: Sensitive data logging - console.log('[Export Trim] No auth token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // REMOVED: Sensitive data logging - console.log('[Export Trim] Verifying auth token...');
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.debug('[Export Trim] Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug('[Export Trim] Auth successful, user:', user.id);

    // Use local Chrome for development, @sparticuz/chromium for production
    const isDev = process.env.NODE_ENV === 'development';

    let executablePath;
    if (isDev) {
      executablePath = process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined;
    } else {
      executablePath = await chromium.executablePath();
      logger.debug('[Export Trim] Chromium path:', executablePath);
    }

    const launchArgs = isDev
      ? ['--no-sandbox']
      : [
          ...chromium.args,
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
        ];

    logger.debug('[Export Trim] Launching browser...');
    const browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    logger.debug('[Export Trim] Browser launched, creating new page...');
    const page = await browser.newPage();

    // Set viewport to match print dimensions
    await page.setViewport({
      width: 528,   // 5.5 inches × 96 DPI
      height: 816,  // 8.5 inches × 96 DPI
      deviceScaleFactor: 1
    });

    // Use actual domain when deployed, localhost for dev
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || `http://127.0.0.1:${process.env.PORT || 3002}`;

    const printUrl = `${baseUrl}/book/print/trim?userId=${user.id}`;
    logger.debug('[Export Trim] Navigating to:', printUrl);

    try {
      await page.goto(printUrl, { waitUntil: 'load', timeout: 60000 });
      logger.debug('[Export Trim] Page loaded');
    } catch (navError) {
      logger.debug('[Export Trim] Navigation error, trying localhost fallback...');
      const fallbackUrl = `http://localhost:${process.env.PORT || 3002}/book/print/trim?userId=${user.id}`;
      await page.goto(fallbackUrl, { waitUntil: 'load', timeout: 60000 });
    }

    logger.debug('[Export Trim] Waiting for content...');

    // Wait for React to hydrate and content to render
    await page.waitForFunction(
      () => {
        const pages = document.querySelectorAll('.page');
        const notLoading = !document.body.innerText.includes('Loading');
        return pages.length > 0 && notLoading;
      },
      { timeout: 45000, polling: 500 }
    );

    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    // Additional wait for rendering
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    logger.debug('[Export Trim] Content loaded, generating PDF...');
    const pdf = await page.pdf({
      width: '5.5in',
      height: '8.5in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false
    });

    logger.debug('[Export Trim] PDF generated, closing browser...');
    await browser.close();

    logger.debug('[Export Trim] Success! Returning PDF');
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="heritage-book-trim.pdf"`
      }
    });

  } catch (error) {
    logger.error('[Export Trim] PDF generation error:', error);
    logger.error('[Export Trim] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
