# PDFShift Integration Guide

## Overview

HeritageWhisper uses [PDFShift](https://pdfshift.io) to convert our print-optimized web pages into high-quality PDFs. This replaced our previous Puppeteer/Chromium solution, reducing build size by ~150MB and deployment time significantly.

## Architecture

### Flow Diagram

```
User clicks "Download PDF"
    ↓
Frontend (/app/book/export/page.tsx)
    ↓
POST /api/export/{2up|trim}
    ↓
Generate temporary print token (5min TTL)
    ↓
PDFShift API receives URL with print token
    ↓
Print page validates token → loads data
    ↓
PDFShift renders page with JS, waits for content
    ↓
PDF returned to user
```

### Key Components

1. **Print Token System** ([/lib/printToken.ts](lib/printToken.ts))
   - Generates temporary tokens (5-minute expiry)
   - Allows PDFShift to access protected pages without full auth
   - In-memory store (consider Redis for production scale)

2. **Print Pages**
   - [/app/book/print/2up/page.tsx](app/book/print/2up/page.tsx) - Home printing (2-up layout)
   - [/app/book/print/trim/page.tsx](app/book/print/trim/page.tsx) - Print-on-demand (trim size)
   - Support 3 auth methods (priority order):
     1. Print token (for PDFShift)
     2. userId param (for direct access)
     3. Supabase session (for user preview)

3. **Export API Routes**
   - [/app/api/export/2up/route.ts](app/api/export/2up/route.ts)
   - [/app/api/export/trim/route.ts](app/api/export/trim/route.ts)
   - Handle auth, token generation, PDF conversion

4. **PDFShift Client** ([/lib/pdfshift.ts](lib/pdfshift.ts))
   - Configures API calls
   - Optimized for React/Next.js rendering

## Configuration

### Environment Variables

```bash
# .env.local
PDFSHIFT_API_KEY=sk_your_api_key_here
```

### PDFShift Settings (Optimized for HeritageWhisper)

```typescript
{
  javascript: true,        // Enable JS execution for React rendering
  delay: 2000,            // Wait 2s after initial page load
  waitFor: 5000,          // Wait up to 5s for dynamic content (images, fonts)
  timeout: 60000,         // 60s max timeout (large books can take time)
  use_print: true,        // Respect CSS @media print styles
  image_quality: 100,     // Maximum image quality
  load_iframes: false,    // Don't load iframes (faster)
}
```

### Format Settings

**2-Up (Home Printing):**
```typescript
{
  landscape: true,
  width: "11in",
  height: "8.5in",
  margin: { top: "0", right: "0", bottom: "0", left: "0" }
}
```

**Trim (Print-on-Demand):**
```typescript
{
  landscape: false,
  width: "5.5in",
  height: "8.5in",
  margin: { top: "0", right: "0", bottom: "0", left: "0" }
}
```

## Security

### Print Token System

- **Token Generation**: 32-byte random hex (crypto.randomBytes)
- **Expiry**: 5 minutes (balances security & PDF generation time)
- **Storage**: In-memory Map (production should use Redis)
- **Validation**: Single-use recommended (add revocation after PDF complete)

### Why Not Regular Auth?

PDFShift is a headless browser service that can't:
- Store cookies between requests
- Handle OAuth redirects
- Maintain Supabase sessions

Print tokens solve this by providing time-limited, purpose-specific access.

## Troubleshooting

### Common Issues

**1. "Print page loads but times out waiting for content"**

**Cause**: React hydration or image loading is slow
**Fix**: Increase `waitFor` or `delay` in export route

```typescript
waitFor: 10000,  // Increase from 5000
delay: 3000,     // Increase from 2000
```

**2. "Invalid or expired print token"**

**Cause**: Token expired (>5min) or already used
**Fix**: Generate new export request. Consider increasing TTL:

```typescript
// In lib/printToken.ts
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```

**3. "Images missing in PDF"**

**Cause**: Images not loaded before PDF capture
**Fix**:
- Add loading indicator in print page
- Use `onLoad` events to track image loading
- Increase `waitFor` timeout

**4. "PDF generation timeout"**

**Cause**: Book is very large (50+ stories)
**Fix**:
- Increase `timeout` in export route (currently 60s)
- Optimize print page (lazy load images, reduce DOM complexity)
- Consider pagination for extremely large books

### Debug Tips

**View what PDFShift sees:**

1. Get print token from server logs
2. Visit: `http://localhost:3002/book/print/2up?printToken=TOKEN`
3. Inspect rendered page before PDF conversion

**Check PDFShift logs:**

```bash
# Server logs show:
[Export 2up] Generated print token for user: abc123
[PDFShift] Starting PDF conversion
[PDFShift] PDF conversion successful (sizeKb: 1234, durationMs: 5678)
```

## Cost Management

### PDFShift Pricing

- **Free Tier**: 50 conversions/month
- **Paid Plans**: From $9/month (500 conversions)
- **Credits**: 1 credit per 5MB of PDF output

### Optimization Tips

1. **Reduce image sizes** in print pages (use responsive images)
2. **Lazy load** non-critical content
3. **Cache PDFs** on your server (add caching layer)
4. **Rate limit** exports per user (prevent abuse)

### Cost Tracking

```typescript
// Add to export routes
await supabaseAdmin.from('pdf_exports').insert({
  user_id: user.id,
  format: '2up',
  size_kb: pdfBuffer.length / 1024,
  duration_ms: duration,
});
```

## Testing

### ⚠️ Important: Localhost Limitation

**PDFShift cannot access localhost URLs.** The service needs to reach your application over the internet. This means:

- ✅ **Works**: Production, staging, any public URL
- ❌ **Fails**: localhost, 127.0.0.1, private networks

### Local Testing (Browser Print Only)

For local development, you can still test the print layouts using browser print:

```bash
# Start dev server
npm run dev

# Open print page in browser
open http://localhost:3002/book/print/2up?userId=YOUR_USER_ID

# Use browser print: ⌘+P (Mac) or Ctrl+P (Windows)
# Choose "Save as PDF"
```

### Production Testing (Full PDFShift)

To test the actual PDF export with PDFShift:

```bash
# 1. Deploy to Vercel or any public URL
git push origin main  # Triggers deployment

# 2. Test from deployed environment
curl -X POST https://dev.heritagewhisper.com/api/export/2up \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  --output test-2up.pdf

# 3. Or use the web interface
# Visit: https://dev.heritagewhisper.com/book/export
```

### Production Testing

```bash
# Check PDFShift credits
curl https://api.pdfshift.io/v3/credits \
  -u "api:YOUR_API_KEY"

# Expected response:
# {"credits": 42}
```

## Future Improvements

### Short Term
- [ ] Add PDF caching (reduce duplicate exports)
- [ ] Implement token revocation after successful PDF
- [ ] Add progress indicator in UI

### Medium Term
- [ ] Move token store to Redis (for multi-instance support)
- [ ] Add PDF preview before download
- [ ] Support custom page ranges (export specific decades)

### Long Term
- [ ] Add watermarking for drafts
- [ ] Support multiple export formats (EPUB, DOCX)
- [ ] Implement server-side pagination for large books

## Resources

- **PDFShift Docs**: https://pdfshift.io/documentation
- **API Reference**: https://pdfshift.io/documentation/parameters
- **Status Page**: https://status.pdfshift.io
- **Support**: support@pdfshift.io

## Migration Notes

### From Vercel App (Previous Solution)

**What Changed:**
- Removed: Separate Vercel deployment with Puppeteer
- Added: PDFShift API integration
- Benefit: ~150MB smaller builds, faster deploys, simpler architecture

**Breaking Changes:**
- None (export URLs remain the same)

**Data Migration:**
- No data migration required
- Existing export functionality works immediately

---

**Last Updated**: January 2025
**Maintained By**: HeritageWhisper Team
