# PDFShift Integration - Deployment Checklist

## Pre-Deployment

### ✅ Environment Variables

Ensure these are set in **Vercel Dashboard** → Your Project → Settings → Environment Variables:

```bash
# Required
PDFSHIFT_API_KEY=sk_9661a98e63679aeec5c28308e4b89fea5d8ce357
NEXT_PUBLIC_SITE_URL=https://dev.heritagewhisper.com

# Already configured (verify they exist)
NEXT_PUBLIC_SUPABASE_URL=https://tjycibrhoammxohemyhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### ✅ Files to Deploy

**New Files:**
- [lib/printToken.ts](lib/printToken.ts)
- [app/api/print-token/validate/route.ts](app/api/print-token/validate/route.ts)
- [PDFSHIFT_INTEGRATION.md](PDFSHIFT_INTEGRATION.md)
- [PDFSHIFT_SETUP_SUMMARY.md](PDFSHIFT_SETUP_SUMMARY.md)
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Modified Files:**
- [lib/pdfshift.ts](lib/pdfshift.ts)
- [app/api/export/2up/route.ts](app/api/export/2up/route.ts)
- [app/api/export/trim/route.ts](app/api/export/trim/route.ts)
- [app/book/print/2up/page.tsx](app/book/print/2up/page.tsx)
- [app/book/print/trim/page.tsx](app/book/print/trim/page.tsx)

## Deployment Steps

### 1. Commit Changes

```bash
git add .
git commit -m "feat: integrate PDFShift for PDF export

- Add print token system for secure PDFShift access
- Update print pages to support token authentication
- Optimize PDFShift API parameters
- Add comprehensive documentation

Closes #[ISSUE_NUMBER]"
git push origin main
```

### 2. Verify Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Check deployment status
3. Wait for build to complete (~2-3 minutes)
4. Click "Visit" to open deployed site

### 3. Test Print Token API

```bash
# Should return error (no token)
curl https://dev.heritagewhisper.com/api/print-token/validate?token=invalid
# Expected: {"error":"Invalid or expired token"}
```

### 4. Test Print Pages (Visual)

1. Sign in to https://dev.heritagewhisper.com
2. Navigate to https://dev.heritagewhisper.com/book/print/2up
3. Verify stories load correctly
4. Check formatting (margins, fonts, images)
5. Repeat for `/book/print/trim`

### 5. Test PDF Export (Full Flow)

1. Go to https://dev.heritagewhisper.com/book/export
2. Click "Download 2-Up PDF"
3. Wait for PDF generation (10-30 seconds)
4. Verify PDF downloads
5. Open PDF and check:
   - ✅ All pages present
   - ✅ Images loaded
   - ✅ Formatting correct
   - ✅ No watermark (if using real API key)
6. Repeat for "Download Trim PDF"

### 6. Check PDFShift Credits

```bash
curl https://api.pdfshift.io/v3/credits \
  -u "api:sk_9661a98e63679aeec5c28308e4b89fea5d8ce357"

# Expected: {"credits": 47}  # or whatever remains
```

### 7. Monitor Server Logs

In Vercel Dashboard → Your Project → Deployments → [Latest] → Runtime Logs:

**Look for:**
```
[Export 2up] Auth successful, user: abc123
[Export 2up] Generated print token for user: abc123
[Export 2up] Generating PDF from: https://...?printToken=TOKEN_REDACTED
[PDFShift] Starting PDF conversion
[PDFShift] PDF conversion successful (sizeKb: 1234, durationMs: 5678)
```

**Watch for errors:**
- ❌ "Cannot access localhost" → baseUrl issue
- ❌ "Invalid API key" → Check PDFSHIFT_API_KEY in Vercel
- ❌ "Format must be..." → PDFShift parameter issue
- ❌ Timeout → Increase timeout or check book size

## Post-Deployment

### ✅ Update Documentation

1. Update [CLAUDE.md](CLAUDE.md) if needed
2. Mark deployment date in docs
3. Archive any old PDF export docs

### ✅ Notify Team

Send message to team:
```
✅ PDFShift integration is live!

What changed:
- PDF export now uses PDFShift (faster, more reliable)
- ~150MB smaller builds
- Same functionality, better performance

Testing:
- Visit https://dev.heritagewhisper.com/book/export
- Click "Download 2-Up PDF" or "Download Trim PDF"

Known limitations:
- Cannot test on localhost (PDFShift needs public URLs)
- Free tier: 50 exports/month

Docs:
- PDFSHIFT_INTEGRATION.md - Technical details
- PDFSHIFT_SETUP_SUMMARY.md - Quick reference
```

### ✅ Monitor Usage

**First Week:**
- Check PDFShift credits daily
- Monitor error logs in Vercel
- Collect user feedback on PDF quality

**Metrics to track:**
- Exports per day
- Average PDF size
- Generation time
- Success/failure rate
- Credits used

## Rollback Plan

If issues arise:

### Quick Rollback (Revert Deployment)

```bash
# In Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
```

### Code Rollback

```bash
# Revert commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <previous-commit-hash>
git push --force origin main
```

### Fallback: Browser Print

Users can always fall back to browser print:
1. Go to /book/print/2up or /book/print/trim
2. Use browser print (⌘+P / Ctrl+P)
3. Choose "Save as PDF"

## Success Criteria

✅ **Deployment is successful when:**
- All tests pass
- PDF exports work for 2-up and trim formats
- Images load correctly in PDFs
- No errors in Vercel logs
- PDFShift credits are being consumed appropriately
- Users can download PDFs without errors

## Support Contacts

- **PDFShift Support**: support@pdfshift.io
- **Vercel Support**: Via dashboard
- **Internal**: Check PDFSHIFT_INTEGRATION.md for troubleshooting

---

**Created**: January 22, 2025
**Last Updated**: January 22, 2025
