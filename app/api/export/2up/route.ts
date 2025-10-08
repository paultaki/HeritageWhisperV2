import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createClient } from '@supabase/supabase-js';

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
    console.log('[Export 2up] Starting PDF export...');

    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('[Export 2up] No auth token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Export 2up] Verifying auth token...');
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.log('[Export 2up] Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Export 2up] Auth successful, user:', user.id);

    const { bookId } = await request.json();

    console.log('[Export 2up] Launching browser...');
    console.log('[Export 2up] Environment:', process.env.NODE_ENV);
    console.log('[Export 2up] Platform:', process.platform);

    // Use local Chrome for development, @sparticuz/chromium for production
    const isDev = process.env.NODE_ENV === 'development';

    let executablePath;
    if (isDev) {
      executablePath = process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined;
    } else {
      executablePath = await chromium.executablePath();
      console.log('[Export 2up] Chromium path:', executablePath);
    }

    const launchArgs = isDev
      ? ['--no-sandbox']
      : [
          ...chromium.args,
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
        ];

    console.log('[Export 2up] Launch args:', launchArgs.join(' '));

    const browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    console.log('[Export 2up] Browser launched, creating new page...');
    const page = await browser.newPage();

    // Set viewport to match print dimensions at 96 DPI
    await page.setViewport({
      width: 1056,  // 11 inches × 96 DPI
      height: 816,  // 8.5 inches × 96 DPI
      deviceScaleFactor: 1
    });
    
    // Use actual domain when deployed, localhost for dev
    // Use 127.0.0.1 instead of localhost for better compatibility with headless browsers
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://127.0.0.1:${process.env.PORT || 3001}`;

    const printUrl = `${baseUrl}/book/print/2up?userId=${user.id}`;
    console.log('[Export 2up] Navigating to:', printUrl);

    try {
      await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (navError) {
      console.log('[Export 2up] Navigation error, trying with localhost...');
      // Fallback to localhost if 127.0.0.1 fails
      const fallbackUrl = `http://localhost:${process.env.PORT || 3001}/book/print/2up?userId=${user.id}`;
      await page.goto(fallbackUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    }

    console.log('[Export 2up] Page loaded, waiting for content...');

    // Check for errors on the page
    const pageErrors: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.error('[Export 2up] Page error:', text);
        pageErrors.push(text);
      } else {
        console.log('[Export 2up] Page log:', text);
      }
    });

    page.on('pageerror', error => {
      console.error('[Export 2up] Page exception:', error);
    });

    // Wait for the page to finish rendering (increased timeout)
    try {
      await page.waitForSelector('.book-spread', { timeout: 30000 });
    } catch (waitError) {
      // Take a screenshot for debugging
      const screenshot = await page.screenshot({ encoding: 'base64' });
      console.error('[Export 2up] Failed to find .book-spread');
      console.error('[Export 2up] Page errors:', pageErrors);
      console.error('[Export 2up] Screenshot (base64):', screenshot.substring(0, 100) + '...');

      // Get the page HTML to see what's actually there
      const html = await page.content();
      console.error('[Export 2up] Page HTML:', html.substring(0, 1000));

      throw waitError;
    }

    // Additional wait to ensure React has hydrated and styles are applied
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    // Debug: Log the actual HTML to see what's being rendered
    try {
      const html = await page.evaluate(() => {
        const firstSpread = document.querySelector('.book-spread');
        if (firstSpread) {
          const computed = window.getComputedStyle(firstSpread);
          return {
            width: computed.width,
            height: computed.height,
            display: computed.display,
            html: document.querySelector('.print-2up')?.outerHTML?.substring(0, 500)
          };
        }
        return { html: 'No .book-spread found' };
      });
      console.log('[Export 2up] Page diagnostics:', JSON.stringify(html, null, 2));
    } catch (evalError) {
      console.error('[Export 2up] Evaluation error:', evalError);
    }

    console.log('[Export 2up] Content loaded, generating PDF...');
    const pdf = await page.pdf({
      width: '11in',
      height: '8.5in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false  // Use our explicit dimensions, not CSS @page
    });

    console.log('[Export 2up] PDF generated, closing browser...');
    await browser.close();

    console.log('[Export 2up] Success! Returning PDF');

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="heritage-book-2up.pdf"`
      }
    });

  } catch (error) {
    console.error('[Export 2up] PDF generation error:', error);
    console.error('[Export 2up] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}