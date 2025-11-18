# Layout & Styling Persistent Issues - Fix Log

## Issue: Content Not Centered with Sidebar (FIXED - 2025-01-28)

### Problem
Profile/settings page content appears pushed to the right when sidebar is visible on desktop. The mic button centers correctly but page content doesn't.

### Root Cause
Using `mx-auto` (margin left/right auto) on content tries to center within the flex container, but when LeftSidebar is present, this causes the content to be offset to the right instead of properly aligned.

### Solution Applied
Changed profile page layout from:
```tsx
<div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
```

To:
```tsx
<div className="max-w-3xl px-4 md:px-6 py-6 md:py-8" style={{ marginLeft: 0, marginRight: "auto" }}>
```

### Pattern to Follow
**For pages WITH LeftSidebar:**
- Use `marginLeft: 0, marginRight: "auto"` (NOT `mx-auto`)
- This keeps content left-aligned within the flex container
- Examples: memory-box, timeline, prompts pages

**For pages WITHOUT sidebar:**
- Can use `mx-auto` for true centering
- Examples: auth pages, landing page

### File Modified
- `/app/profile/page.tsx` (line 565)

## Issue: Logo Size Not Updating (VERIFIED FIXED)

### Problem
Logo size change from 53px to 48px in PageHeader doesn't appear to take effect in browser.

### Verification
Code confirms change is present:
```bash
grep -n "width={48}" components/PageHeader.tsx
# Returns: 149:              width={48}
```

### Likely Cause
Browser caching or Next.js build cache

### Solutions to Try
1. **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. **Clear browser cache** for localhost:3002
4. **Verify in incognito/private window**

### Files Verified
- `/components/PageHeader.tsx` - Line 149: `width={48}` ✓

## Color Palette Reference

For consistency across all pages:

```css
/* Landing Page Colors */
--bg-ivory: #FAF8F6;           /* Soft ivory background */
--accent-mauve: #7C6569;       /* Dusty mauve (CTAs, toggles) */
--text-charcoal: #322B27;      /* Charcoal (headings, body) */
--border-gray: #E0D9D7;        /* Warm light gray (cards, borders) */
--border-light: #EBE8E6;       /* Lighter warm gray */
--text-muted: #99898C;         /* Muted warm gray (secondary text) */
--mauve-light: #9C7280;        /* Lighter mauve tint (highlights) */
--mauve-lighter: #BFA9AB;      /* Lightest mauve */
--highlight-rose: #F9E5E8;     /* Soft rose (backgrounds) */
```

## Recent Changes Applied (2025-01-28)

### Settings/Profile Page
1. ✅ Toggle switches: Yellow → Dusty mauve `#7C6569`
2. ✅ Help section: Amber → Soft rose `#F9E5E8` with mauve text
3. ✅ Primary buttons: Default → Dusty mauve `#7C6569`
4. ✅ Storage progress bar: Default → Dusty mauve `#7C6569`
5. ✅ Layout: Fixed centering issue with sidebar
6. ✅ Header subtitle: "AI preferences" → "preferences"

### Mobile Navigation
1. ✅ Mic icon: 28px → 25px (~10% smaller)
2. ✅ Pulse animation: 2s → 2.6s (30% slower)

### PageHeader Component
1. ✅ Mobile logo: 53px → 48px

## Debugging Checklist

When changes don't appear to stick:

1. **Verify code is saved**
   ```bash
   grep -n "your-change" path/to/file.tsx
   ```

2. **Clear Next.js cache**
   ```bash
   rm -rf .next
   ```

3. **Restart dev server**
   ```bash
   npm run dev
   ```

4. **Hard refresh browser**
   - Mac: Cmd + Shift + R
   - Windows: Ctrl + Shift + R

5. **Check browser console** for errors

6. **Test in incognito/private window** to rule out cache

7. **Verify build succeeds**
   ```bash
   npm run build
   ```

## Common Issues & Solutions

### Issue: `mx-auto` Not Centering with Sidebar
**Solution**: Use `marginLeft: 0, marginRight: "auto"` instead

### Issue: Color Changes Not Applying
**Check**:
- Inline styles override Tailwind classes
- CSS specificity conflicts
- Browser cache

### Issue: Component Changes Not Visible
**Check**:
- Hot reload working (check terminal)
- File saved (check git status)
- No TypeScript/build errors blocking update

---

*Last updated: 2025-01-28*
