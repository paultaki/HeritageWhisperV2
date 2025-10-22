/**
 * PDFShift API Client
 *
 * Lightweight PDF generation service that replaces Puppeteer/Chromium
 * Reduces build size by ~150MB and speeds up deploys significantly
 */

import { logger } from "@/lib/logger";

export interface PDFShiftOptions {
  url: string;
  filename?: string;
  landscape?: boolean;
  format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  width?: string;
  height?: string;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  timeout?: number;
  waitFor?: number;
  javascript?: boolean; // Enable JS execution (needed for React apps)
  delay?: number; // Additional delay after page load (ms)
}

export class PDFShiftClient {
  private apiKey: string;
  private baseUrl = 'https://api.pdfshift.io/v3/convert/pdf';

  constructor(apiKey?: string) {
    // Don't throw error during construction to allow builds to succeed
    // Will validate API key when actually converting PDFs
    this.apiKey = apiKey || process.env.PDFSHIFT_API_KEY || '';
  }

  private validateApiKey() {
    if (!this.apiKey) {
      throw new Error('PDFShift API key not found. Set PDFSHIFT_API_KEY in environment variables.');
    }
  }

  /**
   * Convert a URL to PDF
   */
  async convertUrl(options: PDFShiftOptions): Promise<Buffer> {
    // Validate API key at runtime, not build time
    this.validateApiKey();

    const startTime = Date.now();

    logger.info('[PDFShift] Starting PDF conversion', {
      url: options.url,
      format: options.format,
      landscape: options.landscape,
    });

    try {
      const body: any = {
        source: options.url,
        use_print: true, // Use CSS @media print styles
        delay: options.delay || 2000, // Additional delay after page load (ms)
      };

      // Format: either standard (Letter, A4, etc) or custom (11inx8.5in)
      if (options.width && options.height) {
        // Custom dimensions using format: {width}x{height}
        // Remove any spaces and combine with 'x'
        const width = options.width.replace(/\s/g, '');
        const height = options.height.replace(/\s/g, '');
        body.format = `${width}x${height}`;
      } else {
        // Standard format (Letter, Legal, A4, etc)
        body.format = options.format || 'Letter';
      }

      // Landscape orientation
      if (options.landscape) {
        body.landscape = true;
      }

      // Margins
      if (options.margin) {
        body.margin = options.margin;
      }

      const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[PDFShift] API error', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
      }

      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      const duration = Date.now() - startTime;

      logger.info('[PDFShift] PDF conversion successful', {
        sizeKb: Math.round(pdfBuffer.length / 1024),
        durationMs: duration,
      });

      return pdfBuffer;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[PDFShift] Conversion failed', {
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration,
      });
      throw error;
    }
  }

  /**
   * Check API credit balance
   */
  async checkCredits(): Promise<{ credits: number }> {
    this.validateApiKey();

    try {
      const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');

      const response = await fetch('https://api.pdfshift.io/v3/credits', {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check credits: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('[PDFShift] Failed to check credits', { error });
      throw error;
    }
  }
}

/**
 * Create a singleton instance
 */
export const pdfshift = new PDFShiftClient();
